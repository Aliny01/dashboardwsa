import { GoogleAdsApi } from 'google-ads-api'
import { AGENCY_CLIENTS, GOOGLE_MCC_LOGIN_CUSTOMER_ID, type AgencyClient } from '@/lib/agency-clients'
import { findBoletoSchedule, nextExpectedDate, type BoletoFrequency } from '@/lib/boleto-schedule'

const META_BASE = 'https://graph.facebook.com/v21.0'
const META_TOKEN = process.env.META_ACCESS_TOKEN!

export type PaymentType = 'Cartão' | 'Verba' | 'Sem dados'

export interface ClientPaymentRow {
  clientKey: string
  clientName: string
  platform: 'Meta' | 'Google'
  active: boolean
  paymentType: PaymentType
  cardLabel?: string
  balanceLabel?: string
  exhausted?: boolean
  spend7d: number
  error?: string
  boletoAmount?: number
  boletoFrequency?: BoletoFrequency
  lastPaymentDate?: string
  nextExpectedDate?: string
}

interface GoogleAccountBudgetRow {
  account_budget?: {
    approved_spending_limit_micros?: string | number
    amount_served_micros?: string | number
    status?: string
  }
}

interface GoogleCustomerCostRow {
  metrics?: { cost_micros?: number }
}

function parseNum(v: string | number | undefined | null): number {
  if (v === undefined || v === null) return 0
  return typeof v === 'number' ? v : parseFloat(v) || 0
}

async function metaFetchNoCache(path: string, params: Record<string, string>, retries = 2) {
  const url = new URL(`${META_BASE}/${path}`)
  url.searchParams.set('access_token', META_TOKEN)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url.toString(), { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error?.message ?? `Meta API error ${res.status}`)
      }
      return json
    } catch (err) {
      lastError = err
    }
  }
  throw lastError
}

function parseMetaFunding(fundingSourceDetails: { type?: number; display_string?: string } | undefined) {
  if (!fundingSourceDetails) {
    return { paymentType: 'Sem dados' as PaymentType }
  }
  const { type, display_string } = fundingSourceDetails

  // type 1 = cartão de crédito. Qualquer outro tipo (boleto/pix/saldo) tratamos como "Verba".
  // Algumas contas de cartão não trazem display_string (só cupons expirados) — ainda assim é cartão.
  if (type === 1) {
    return { paymentType: 'Cartão' as PaymentType, cardLabel: display_string ?? 'Cartão' }
  }

  if (!display_string) {
    return { paymentType: 'Sem dados' as PaymentType }
  }

  const match = display_string.match(/R\$\s?([\d.,]+)/)
  if (match) {
    const value = parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
    return {
      paymentType: 'Verba' as PaymentType,
      balanceLabel: `R$ ${match[1]}`,
      exhausted: value <= 0,
    }
  }
  return { paymentType: 'Verba' as PaymentType, balanceLabel: display_string }
}

async function fetchMetaRow(client: AgencyClient): Promise<ClientPaymentRow> {
  const base: ClientPaymentRow = {
    clientKey: client.key,
    clientName: client.name,
    platform: 'Meta',
    active: false,
    paymentType: 'Sem dados',
    spend7d: 0,
  }
  if (!client.metaAccountId) return base

  try {
    const [acc, ins] = await Promise.all([
      metaFetchNoCache(client.metaAccountId, {
        fields: 'funding_source_details,spend_cap,amount_spent,account_status',
      }),
      metaFetchNoCache(`${client.metaAccountId}/insights`, {
        date_preset: 'last_7d',
        fields: 'spend',
      }),
    ])

    const spend7d = parseNum(ins.data?.[0]?.spend)
    const funding = parseMetaFunding(acc.funding_source_details)

    return {
      ...base,
      active: spend7d > 0,
      spend7d,
      ...funding,
    }
  } catch (error) {
    return { ...base, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

async function fetchGoogleRow(client: AgencyClient): Promise<ClientPaymentRow> {
  const base: ClientPaymentRow = {
    clientKey: client.key,
    clientName: client.name,
    platform: 'Google',
    active: false,
    paymentType: 'Sem dados',
    spend7d: 0,
  }
  if (!client.googleCustomerId) return base

  try {
    const gClient = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    })
    const customer = gClient.Customer({
      customer_id: client.googleCustomerId,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN!,
      login_customer_id: GOOGLE_MCC_LOGIN_CUSTOMER_ID,
    })

    const [budgetRows, spendRows] = await Promise.all([
      customer.query(`
        SELECT account_budget.approved_spending_limit_micros, account_budget.amount_served_micros, account_budget.status
        FROM account_budget
      `).catch(() => [] as GoogleAccountBudgetRow[]),
      customer.query(`
        SELECT metrics.cost_micros
        FROM customer
        WHERE segments.date DURING LAST_7_DAYS
      `),
    ]) as [GoogleAccountBudgetRow[], GoogleCustomerCostRow[]]

    const spend7d = spendRows.reduce((sum, r) => sum + (r.metrics?.cost_micros ?? 0), 0) / 1_000_000

    // Sem account_budget com limite = fatura mensal normal (cartão/boleto sem teto fixo).
    const budget = budgetRows[0]?.account_budget
    if (!budget || !budget.approved_spending_limit_micros) {
      return {
        ...base,
        active: spend7d > 0,
        spend7d,
        paymentType: 'Cartão',
        cardLabel: 'Faturamento mensal',
      }
    }

    const limit = parseNum(budget.approved_spending_limit_micros) / 1_000_000
    const served = parseNum(budget.amount_served_micros) / 1_000_000
    const remaining = limit - served

    return {
      ...base,
      active: spend7d > 0,
      spend7d,
      paymentType: 'Verba',
      balanceLabel: `R$ ${remaining.toFixed(2).replace('.', ',')}`,
      exhausted: remaining <= 0,
    }
  } catch (error) {
    return { ...base, error: error instanceof Error ? error.message : 'Erro desconhecido' }
  }
}

export async function fetchAllPayments(): Promise<ClientPaymentRow[]> {
  const tasks: Promise<ClientPaymentRow>[] = []
  for (const client of AGENCY_CLIENTS) {
    if (client.metaAccountId) tasks.push(fetchMetaRow(client))
    if (client.googleCustomerId) tasks.push(fetchGoogleRow(client))
  }
  const results = await Promise.all(tasks)

  const withBoleto = results.map((row) => {
    const schedule = findBoletoSchedule(row.clientKey, row.platform)
    if (!schedule) return row
    return {
      ...row,
      boletoAmount: schedule.amount,
      boletoFrequency: schedule.frequency,
      lastPaymentDate: schedule.lastPaymentDate,
      nextExpectedDate: nextExpectedDate(schedule),
    }
  })

  return withBoleto.sort((a, b) => a.clientName.localeCompare(b.clientName) || a.platform.localeCompare(b.platform))
}
