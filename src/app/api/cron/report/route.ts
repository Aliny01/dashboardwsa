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

export async function GET(request: Request) {
  // Proteção: só roda com o secret correto (Vercel envia automaticamente)
  const auth = request.headers.get('authorization')
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (auth !== `Bearer ${process.env.CRON_SECRET}` && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const yesterday = subDays(new Date(), 1)
    const dateStr = format(yesterday, 'yyyy-MM-dd')
    const dateLabel = format(yesterday, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

    const [meta, google] = await Promise.allSettled([
      fetchMetaDashboard({ since: dateStr, until: dateStr }),
      fetchGoogleDashboard({ since: dateStr, until: dateStr }),
    ])

    // — Meta Ads —
    if (meta.status === 'fulfilled') {
      const data = meta.value
      const activeCampaigns = data.campaigns.filter(c => c.spend > 0)

      const metaMessage = [
        `<b>Meta Ads — ${dateLabel}</b>`,
        ``,
        `Gasto: <b>${fmt(data.overview.spend)}</b>`,
        `Alcance: <b>${fmtN(data.overview.reach)}</b>`,
        `Cliques: <b>${fmtN(data.overview.clicks)}</b>`,
        `Mensagens WhatsApp: <b>${data.overview.messages}</b>`,
        `Leads formulário: <b>${data.overview.leads}</b>`,
        `Campanhas ativas: <b>${activeCampaigns.length}</b>`,
      ].join('\n')

      await sendTelegram(metaMessage)

      const semResultado = activeCampaigns.filter(
        c => c.spend > 10 && c.leads === 0 && c.messages === 0
      )
      if (semResultado.length > 0) {
        await sendTelegram(
          `⚠️ <b>Meta — sem resultado (gasto &gt; R$10):</b>\n` +
          semResultado.map(c => `• ${c.name.substring(0, 50)}`).join('\n')
        )
      }
    } else {
      await sendTelegram(`⚠️ <b>Meta Ads:</b> erro ao buscar dados — ${meta.reason?.message ?? 'desconhecido'}`)
    }

    // — Google Ads —
    if (google.status === 'fulfilled') {
      const data = google.value
      const activeCampaigns = data.campaigns.filter(c => c.cost > 0)
      const conv = data.overview.conversionBreakdown

      const googleMessage = [
        `<b>Google Ads — ${dateLabel}</b>`,
        ``,
        `Gasto: <b>${fmt(data.overview.cost)}</b>`,
        `Cliques: <b>${fmtN(data.overview.clicks)}</b>`,
        `Impressões: <b>${fmtN(data.overview.impressions)}</b>`,
        `Conversões: <b>${Math.round(data.overview.conversions)}</b>`,
        ...(conv.calls > 0 ? [`Chamadas: <b>${Math.round(conv.calls)}</b>`] : []),
        ...(conv.contacts > 0 ? [`Contatos: <b>${Math.round(conv.contacts)}</b>`] : []),
        `Campanhas ativas: <b>${activeCampaigns.length}</b>`,
      ].join('\n')

      await sendTelegram(googleMessage)
    } else {
      await sendTelegram(`⚠️ <b>Google Ads:</b> erro ao buscar dados — ${google.reason?.message ?? 'desconhecido'}`)
    }

    return NextResponse.json({ ok: true, sent: true, date: dateStr })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    await sendTelegram(`❌ Erro no relatório diário: ${message}`)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
