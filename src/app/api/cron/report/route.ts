import { NextResponse } from 'next/server'
import { fetchMetaDashboard } from '@/lib/meta-api'
import { fetchGoogleDashboard } from '@/lib/google-api'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(n)
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

function buildDateRange(today: Date): { since: string; until: string; label: string; isWeekend: boolean } {
  const isMonday = today.getDay() === 1

  if (isMonday) {
    const friday = subDays(today, 3)
    const sunday = subDays(today, 1)
    const friLabel = format(friday, 'dd', { locale: ptBR })
    const sunLabel = format(sunday, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    return {
      since: format(friday, 'yyyy-MM-dd'),
      until: format(sunday, 'yyyy-MM-dd'),
      label: `Sexta a Domingo — ${friLabel} a ${sunLabel}`,
      isWeekend: true,
    }
  }

  const yesterday = subDays(today, 1)
  return {
    since: format(yesterday, 'yyyy-MM-dd'),
    until: format(yesterday, 'yyyy-MM-dd'),
    label: format(yesterday, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
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
    // Permite override manual: ?since=2026-07-26&until=2026-07-27
    const forceSince = searchParams.get('since')
    const forceUntil = searchParams.get('until')

    let since: string, until: string, label: string, isWeekend: boolean

    if (forceSince && forceUntil) {
      since = forceSince
      until = forceUntil
      isWeekend = forceSince !== forceUntil
      label = isWeekend
        ? `Fim de semana — ${forceSince} a ${forceUntil}`
        : forceSince
    } else {
      ;({ since, until, label, isWeekend } = buildDateRange(new Date()))
    }

    const [meta, google] = await Promise.allSettled([
      fetchMetaDashboard({ since, until }),
      fetchGoogleDashboard({ since, until }),
    ])

    const lines: string[] = [`<b>Relatório de Mídia — ${label}</b>`, ``]

    // — Meta Ads —
    if (meta.status === 'fulfilled') {
      const data = meta.value
      lines.push(
        `<b>Meta Ads</b>`,
        `Gasto: <b>${fmt(data.overview.spend)}</b>`,
        `Alcance: <b>${fmtN(data.overview.reach)}</b>`,
        `Cliques: <b>${fmtN(data.overview.clicks)}</b>`,
        `Mensagens WhatsApp: <b>${data.overview.messages}</b>`,
        `Leads formulário: <b>${data.overview.leads}</b>`,
      )
    } else {
      lines.push(`<b>Meta Ads</b>`, `⚠️ Erro ao buscar dados`)
    }

    lines.push(``)

    // — Google Ads —
    if (google.status === 'fulfilled') {
      const data = google.value
      const conv = data.overview.conversionBreakdown
      const contatos = Math.round(conv.contacts)

      const top3Keywords = [...data.keywords]
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 3)

      const keywordsComConversao = data.keywords.filter(k => k.conversions > 0)

      lines.push(
        `<b>Google Ads</b>`,
        `Gasto: <b>${fmt(data.overview.cost)}</b>`,
        `Cliques: <b>${fmtN(data.overview.clicks)}</b>`,
        `Impressões: <b>${fmtN(data.overview.impressions)}</b>`,
        ...(contatos > 0 ? [`Contatos: <b>${contatos}</b>`] : []),
        ...(conv.calls > 0 ? [`Chamadas: <b>${Math.round(conv.calls)}</b>`] : []),
      )

      if (top3Keywords.length > 0) {
        lines.push(``, `<b>Termos mais buscados:</b>`)
        top3Keywords.forEach((k, i) => {
          lines.push(`${i + 1}. ${k.keyword} — ${fmtN(k.impressions)} impressões`)
        })
      }

      if (keywordsComConversao.length > 0) {
        lines.push(``, `<b>Termos com conversão:</b>`)
        keywordsComConversao.forEach(k => {
          lines.push(`• ${k.keyword} — ${Math.round(k.conversions)} conversão(ões)`)
        })
      }
    } else {
      lines.push(`<b>Google Ads</b>`, `⚠️ Erro ao buscar dados`)
    }

    await sendTelegram(lines.join('\n'))

    // Alerta de campanhas sem resultado (só no relatório diário)
    if (!isWeekend && meta.status === 'fulfilled') {
      const semResultado = meta.value.campaigns.filter(
        c => c.spend > 10 && c.leads === 0 && c.messages === 0
      )
      if (semResultado.length > 0) {
        await sendTelegram(
          `⚠️ <b>Meta — sem resultado (gasto &gt; R$10):</b>\n` +
          semResultado.map(c => `• ${c.name.substring(0, 50)}`).join('\n')
        )
      }
    }

    return NextResponse.json({ ok: true, sent: true, since, until, isWeekend })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    await sendTelegram(`❌ Erro no relatório diário: ${message}`)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
