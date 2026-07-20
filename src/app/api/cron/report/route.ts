import { NextResponse } from 'next/server'
import { fetchMetaDashboard } from '@/lib/meta-api'
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

    const data = await fetchMetaDashboard({ since: dateStr, until: dateStr })

    const activeCampaigns = data.campaigns.filter(c => c.spend > 0)
    const totalSpend = data.overview.spend
    const totalMessages = data.overview.messages
    const totalLeads = data.overview.leads
    const totalClicks = data.overview.clicks
    const totalReach = data.overview.reach

    const top3 = [...activeCampaigns]
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 3)

    const semResultado = activeCampaigns.filter(
      c => c.spend > 10 && c.leads === 0 && c.messages === 0
    )

    const topLines = top3.map((c, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'
      const results = c.messages + c.leads
      const resultStr = results > 0 ? ` | ${results} result.` : ''
      const name = c.name.length > 35 ? c.name.substring(0, 35) + '…' : c.name
      return `${medal} ${name}\n    ${fmt(c.spend)}${resultStr}`
    }).join('\n')

    const alertLines = semResultado.length > 0
      ? `\n⚠️ <b>Sem resultado (gasto &gt; R$10):</b>\n` +
        semResultado.map(c => `• ${c.name.substring(0, 40)}`).join('\n')
      : ''

    const message = [
      `📊 <b>WSA Dashboard — Relatório Diário</b>`,
      `📅 ${dateLabel}`,
      ``,
      `💰 Gasto: <b>${fmt(totalSpend)}</b>`,
      `👥 Alcance: <b>${fmtN(totalReach)}</b>`,
      `🖱️ Cliques: <b>${fmtN(totalClicks)}</b>`,
      `💬 Mensagens: <b>${totalMessages}</b>`,
      `🎯 Leads: <b>${totalLeads}</b>`,
      `📣 Campanhas ativas: <b>${activeCampaigns.length}</b>`,
      ``,
      `🏆 <b>Top campanhas:</b>`,
      topLines,
      alertLines,
    ].join('\n')

    await sendTelegram(message)

    return NextResponse.json({ ok: true, sent: true, date: dateStr })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    await sendTelegram(`❌ Erro no relatório diário: ${message}`)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
