import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { MetaDashboardData, MetaCampaignSummary } from '@/types/meta'
import { FOLLOWERS_KEYWORDS, CAMPAIGN_CATEGORIES, matchesKeywords } from '@/lib/campaign-categories'

interface FollowerEntry {
  weekEnd: string
  totalFollowers: number
  investedAmount: number
}

function fmt(n: number, style: 'currency' | 'decimal' = 'decimal') {
  if (style === 'currency') {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(n)
  }
  return new Intl.NumberFormat('pt-BR').format(Math.round(n))
}

function sectionTitle(doc: jsPDF, text: string, y: number): number {
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(24, 95, 165)
  doc.text(text.toUpperCase(), 14, y)
  doc.setTextColor(0, 0, 0)
  return y + 4
}

function campaignsTable(doc: jsPDF, campaigns: MetaCampaignSummary[], startY: number): number {
  if (!campaigns.length) return startY
  autoTable(doc, {
    startY,
    head: [['Campanha', 'Investido', 'Alcance', 'Cliques', 'CPC', 'Leads / Conv.']],
    body: campaigns.map((c) => [
      c.name.length > 36 ? c.name.slice(0, 34) + '…' : c.name,
      fmt(c.spend, 'currency'),
      fmt(c.reach),
      fmt(c.clicks),
      c.cpc > 0 ? fmt(c.cpc, 'currency') : '—',
      c.leads > 0 && c.messages > 0
        ? `${fmt(c.leads)} / ${fmt(c.messages)}`
        : c.leads > 0 ? fmt(c.leads)
        : c.messages > 0 ? fmt(c.messages)
        : '—',
    ]),
    headStyles: { fillColor: [24, 95, 165], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: [240, 247, 255] },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  })
  return (doc as any).lastAutoTable.finalY + 8
}

export function exportMetaPDF(data: MetaDashboardData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()

  const sinceLabel = format(new Date(data.period.since + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })
  const untilLabel = format(new Date(data.period.until + 'T12:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

  // ── Header ───────────────────────────────────────────────────────────────────
  doc.setFillColor(24, 95, 165)
  doc.rect(0, 0, pageW, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('WSA Dashboard', 14, 12)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Relatório — Meta Ads', 14, 19)
  doc.text(`Período: ${sinceLabel} – ${untilLabel}`, 14, 25)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(data.account_name, pageW - 14, 16, { align: 'right' })
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageW - 14, 24, { align: 'right' })
  doc.setTextColor(0, 0, 0)

  let y = 36

  // ── Seguidores Instagram ─────────────────────────────────────────────────────
  const followerEntries: FollowerEntry[] = JSON.parse(
    (typeof localStorage !== 'undefined' && localStorage.getItem('wsa_followers_history')) || '[]'
  )

  const followerCampaigns = data.campaigns.filter(
    (c) => c.spend > 0 && matchesKeywords(c.name, FOLLOWERS_KEYWORDS)
  )
  const autoInvested = followerCampaigns.reduce((sum, c) => sum + c.spend, 0)

  if (followerEntries.length > 0 || followerCampaigns.length > 0) {
    y = sectionTitle(doc, 'Seguidores Instagram', y)

    if (followerEntries.length > 0) {
      const last = followerEntries[followerEntries.length - 1]
      const prev = followerEntries[followerEntries.length - 2]
      const newFollowers = prev ? last.totalFollowers - prev.totalFollowers : null
      const costPerFollower = newFollowers && newFollowers > 0 ? last.investedAmount / newFollowers : null

      autoTable(doc, {
        startY: y,
        head: [['Total seguidores', 'Novos no período', 'Investido', 'Custo/seguidor']],
        body: [[
          fmt(last.totalFollowers),
          newFollowers !== null ? `+${fmt(newFollowers)}` : '—',
          fmt(last.investedAmount, 'currency'),
          costPerFollower !== null ? fmt(costPerFollower, 'currency') : '—',
        ]],
        headStyles: { fillColor: [88, 28, 135], fontSize: 8 },
        bodyStyles: { fontSize: 9, fontStyle: 'bold' },
        columnStyles: { 0: { halign: 'right' }, 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
        margin: { left: 14, right: 14 },
      })
      y = (doc as any).lastAutoTable.finalY + 5

      // History (last 4 entries)
      const recent = [...followerEntries].reverse().slice(0, 4)
      autoTable(doc, {
        startY: y,
        head: [['Data', 'Total seguidores', 'Novos', 'Investido', 'Custo/seguidor']],
        body: recent.map((entry, i) => {
          const origIdx = followerEntries.length - 1 - i
          const prevEntry = followerEntries[origIdx - 1]
          const nf = prevEntry ? entry.totalFollowers - prevEntry.totalFollowers : null
          const cpf = nf && nf > 0 ? entry.investedAmount / nf : null
          return [
            new Date(entry.weekEnd + 'T12:00:00').toLocaleDateString('pt-BR'),
            fmt(entry.totalFollowers),
            nf !== null ? `+${fmt(nf)}` : '—',
            fmt(entry.investedAmount, 'currency'),
            cpf !== null ? fmt(cpf, 'currency') : '—',
          ]
        }),
        headStyles: { fillColor: [107, 33, 168], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [250, 245, 255] },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
        margin: { left: 14, right: 14 },
      })
      y = (doc as any).lastAutoTable.finalY + 5
    }

    if (followerCampaigns.length > 0) {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      doc.text(`Campanhas de seguidores — investido no período: ${fmt(autoInvested, 'currency')}`, 14, y)
      doc.setTextColor(0, 0, 0)
      y += 3
      y = campaignsTable(doc, followerCampaigns, y)
    }

    y += 2
  }

  // ── Visão Geral ───────────────────────────────────────────────────────────────
  y = sectionTitle(doc, 'Visão Geral — Meta Ads', y)
  autoTable(doc, {
    startY: y,
    head: [['Métrica', 'Valor']],
    body: [
      ['Valor Investido', fmt(data.overview.spend, 'currency')],
      ['Alcance', fmt(data.overview.reach)],
      ['Impressões', fmt(data.overview.impressions)],
      ['Cliques', fmt(data.overview.clicks)],
      ['CPC Médio', fmt(data.overview.cpc, 'currency')],
      ['CPM', fmt(data.overview.cpm, 'currency')],
      ['Leads', fmt(data.overview.leads)],
      ['Conversas Iniciadas', fmt(data.overview.messages)],
    ],
    headStyles: { fillColor: [24, 95, 165], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [240, 247, 255] },
    columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    margin: { left: 14, right: 14 },
  })
  y = (doc as any).lastAutoTable.finalY + 10

  // ── Campanhas por categoria ───────────────────────────────────────────────────
  for (const { label, keywords } of CAMPAIGN_CATEGORIES) {
    const filtered = data.campaigns.filter(
      (c) => c.spend > 0 && matchesKeywords(c.name, keywords)
    )
    if (!filtered.length) continue

    if (y > pageH - 50) { doc.addPage(); y = 14 }
    y = sectionTitle(doc, label, y)
    y = campaignsTable(doc, filtered, y)
  }

  // ── Outras campanhas ──────────────────────────────────────────────────────────
  const allKeywords = [...FOLLOWERS_KEYWORDS, ...CAMPAIGN_CATEGORIES.flatMap((c) => c.keywords)]
  const others = data.campaigns.filter(
    (c) => c.spend > 0 && !matchesKeywords(c.name, allKeywords)
  )
  if (others.length) {
    if (y > pageH - 50) { doc.addPage(); y = 14 }
    y = sectionTitle(doc, 'Outras campanhas', y)
    y = campaignsTable(doc, others, y)
  }

  // ── Footer em todas as páginas ────────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text('WSA — Relatório gerado automaticamente pelo WSA Dashboard', 14, pageH - 8)
    doc.text(`Página ${i} / ${totalPages}`, pageW - 14, pageH - 8, { align: 'right' })
  }

  doc.save(`relatorio-meta-${data.period.since}-${data.period.until}.pdf`)
}
