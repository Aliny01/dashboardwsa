import { NextResponse } from 'next/server'
import { fetchGoogleDashboard } from '@/lib/google-api'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!
const META_TOKEN = process.env.META_EXCELENCIA_TOKEN!
const META_ACCOUNT = 'act_815866793070355'
const GOOGLE_CUSTOMER = '4096505407'
const BASE_META = 'https://graph.facebook.com/v19.0'

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(n)
}
function fmtN(n: number) {
  return new Intl.NumberFormat('pt-BR').format(Math.round(n))
}

async function sendTelegram(text: string) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' }),
  })
}

async function fetchMetaExcelencia(since: string, until: string) {
  const fields = 'spend,reach,impressions,clicks,actions'
  const timeRange = JSON.stringify({ since, until })

  const url = new URL(`${BASE_META}/${META_ACCOUNT}/insights`)
  url.searchParams.set('access_token', META_TOKEN)
  url.searchParams.set('fields', fields)
  url.searchParams.set('time_range', timeRange)
  url.searchParams.set('level', 'account')

  const res = await fetch(url.toString())
  const data = await res.json()
  const ins = data.data?.[0] ?? {}

  const getAction = (type: string) =>
    parseFloat(ins.actions?.find((a: { action_type: string; value: string }) => a.action_type === type)?.value ?? '0') || 0

  return {
    spend: parseFloat(ins.spend ?? '0') || 0,
    reach: parseFloat(ins.reach ?? '0') || 0,
    impressions: parseFloat(ins.impressions ?? '0') || 0,
    clicks: parseFloat(ins.clicks ?? '0') || 0,
    messages: getAction('onsite_conversion.messaging_first_reply'),
    conversations: getAction('onsite_conversion.messaging_conversation_started_7d'),
  }
}

function buildDateRange(today: Date) {
  const isMonday = today.getDay() === 1
  if (isMonday) {
    const friday = subDays(today, 3)
    const sunday = subDays(today, 1)
    return {
      since: format(friday, 'yyyy-MM-dd'),
      until: format(sunday, 'yyyy-MM-dd'),
      label: `Fim de semana — ${format(friday, 'dd')} a ${format(sunday, "dd 'de' MMMM", { locale: ptBR })}`,
      isWeekend: true,
    }
  }
  const yesterday = subDays(today, 1)
  return {
    since: format(yesterday, 'yyyy-MM-dd'),
    until: format(yesterday, 'yyyy-MM-dd'),
    label: format(yesterday, "EEEE, dd 'de' MMMM", { locale: ptBR }),
    isWeekend: false,
  }
}

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (auth !== `Bearer ${process.env.CRON_SECRET}` && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const forceSince = searchParams.get('since')
    const forceUntil = searchParams.get('until')

    let since: string, until: string, label: string, isWeekend: boolean

    if (forceSince && forceUntil) {
      since = forceSince
      until = forceUntil
      isWeekend = forceSince !== forceUntil
      label = isWeekend ? `${forceSince} a ${forceUntil}` : forceSince
    } else {
      ;({ since, until, label, isWeekend } = buildDateRange(new Date()))
    }

    const [meta, google] = await Promise.allSettled([
      fetchMetaExcelencia(since, until),
      fetchGoogleDashboard({ since, until }, GOOGLE_CUSTOMER),
    ])

    const lines: string[] = [
      `✨ <b>Excelência Transporte — ${label}</b>`,
      ``,
    ]

    // — Meta Ads —
    if (meta.status === 'fulfilled') {
      const d = meta.value
      lines.push(
        `<b>📱 Meta Ads</b>`,
        `👥 Alcance: <b>${fmtN(d.reach)} pessoas</b>`,
        `💰 Investimento: <b>${fmt(d.spend)}</b>`,
        `🖱 Cliques: <b>${fmtN(d.clicks)}</b>`,
        ...(d.messages > 0 ? [`💬 Contatos WhatsApp: <b>${Math.round(d.messages)}</b>`] : []),
        ...(d.conversations > 0 && d.messages === 0 ? [`💬 Conversas iniciadas: <b>${Math.round(d.conversations)}</b>`] : []),
      )
    } else {
      lines.push(`<b>📱 Meta Ads</b>`, `⚠️ Erro ao buscar dados`)
    }

    lines.push(``)

    // — Google Ads —
    if (google.status === 'fulfilled') {
      const d = google.value
      const contatos = Math.round(d.overview.conversionBreakdown.contacts)
      lines.push(
        `<b>🔍 Google Ads</b>`,
        `💰 Investimento: <b>${fmt(d.overview.cost)}</b>`,
        `🖱 Cliques: <b>${fmtN(d.overview.clicks)}</b>`,
        `📊 Impressões: <b>${fmtN(d.overview.impressions)}</b>`,
        ...(contatos > 0 ? [`💬 Contatos WhatsApp: <b>${contatos}</b>`] : []),
      )
    } else {
      lines.push(`<b>🔍 Google Ads</b>`, `⚠️ Erro ao buscar dados`)
    }

    // Totais combinados
    if (meta.status === 'fulfilled' && google.status === 'fulfilled') {
      const totalSpend = meta.value.spend + google.value.overview.cost
      const totalContatos = Math.round(meta.value.messages) + Math.round(google.value.overview.conversionBreakdown.contacts)
      lines.push(
        ``,
        `<b>Total investido: ${fmt(totalSpend)}</b>`,
        ...(totalContatos > 0 ? [`<b>Total de contatos: ${totalContatos}</b>`] : []),
      )
    }

    await sendTelegram(lines.join('\n'))

    return NextResponse.json({ ok: true, since, until })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    await sendTelegram(`❌ Erro no relatório Excelência: ${message}`)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
