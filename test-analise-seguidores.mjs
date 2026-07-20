const res = await fetch('http://localhost:3000/api/meta?since=2026-06-09&until=2026-06-16&creatives=true')
const data = await res.json()

const FOLLOWERS_KEYWORDS = [
  '[TRÁFEGO] [SEGUIDORES]',
  'Post do Instagram',
  'Publicação do Instagram',
]

function matches(name) {
  const n = name.toLowerCase()
  return FOLLOWERS_KEYWORDS.some((kw) => n.includes(kw.toLowerCase()))
}

const activeCampaigns = data.campaigns.filter((c) => c.status === 'ACTIVE' && matches(c.name))
const allCampaigns = data.campaigns.filter((c) => matches(c.name) && c.spend > 0)

const videos = data.creatives.filter((cr) => {
  const camp = data.campaigns.find((c) => c.id === cr.campaignId)
  return cr.type === 'video' && camp && matches(camp.name)
})

function fmt(n, style = 'decimal') {
  if (style === 'currency') return `R$ ${n.toFixed(2).replace('.', ',')}`
  return Math.round(n).toLocaleString('pt-BR')
}

function pct(v, base) {
  if (!base) return '0,0%'
  return `${((v / base) * 100).toFixed(1)}%`
}

console.log(`\n${'='.repeat(60)}`)
console.log(`ANÁLISE CAMPANHAS DE SEGUIDORES — 09/06 a 16/06/2026`)
console.log(`${'='.repeat(60)}\n`)

// Resumo por campanha
console.log('RESUMO POR CAMPANHA')
console.log('-'.repeat(60))
for (const c of allCampaigns) {
  const status = c.status === 'ACTIVE' ? '🟢 ATIVA' : '🔴 PAUSADA'
  console.log(`${status}  ${c.name}`)
  console.log(`   Alcance: ${fmt(c.reach)} | Cliques: ${fmt(c.link_clicks)} | Gasto: ${fmt(c.spend, 'currency')}`)
  console.log(`   Leads: ${c.leads} | Mensagens: ${c.messages}`)
  console.log()
}

// Análise por vídeo
console.log('\nANÁLISE POR VÍDEO')
console.log('-'.repeat(60))

const enriched = videos.map((v) => {
  const reach = v.reach || 0
  const clicks = v.clicks || 0
  const p25 = v.video_p25 || 0
  const p50 = v.video_p50 || 0
  const p95 = v.video_p95 || 0
  const ctr = reach > 0 ? (clicks / reach) * 100 : 0
  const ret95 = reach > 0 ? (p95 / reach) * 100 : 0
  const ret50 = reach > 0 ? (p50 / reach) * 100 : 0
  const leads = v.leads || 0
  const messages = v.messages || 0
  const results = leads + messages
  const spend = v.spend || 0
  const costPerResult = results > 0 ? spend / results : null
  const camp = data.campaigns.find((c) => c.id === v.campaignId)
  return { ...v, reach, clicks, p25, p50, p95, ctr, ret95, ret50, results, costPerResult, campName: camp?.name ?? '' }
}).filter(v => v.spend > 0)

// Ordenar por retenção 95%
const byRetention = [...enriched].sort((a, b) => b.ret95 - a.ret95)
// Ordenar por visitas
const byClicks = [...enriched].sort((a, b) => b.clicks - a.clicks)
// Ordenar por resultados
const byResults = [...enriched].sort((a, b) => b.results - a.results)

console.log('\n📊 RANKING — RETENÇÃO DE VÍDEO (% que assistiu 95%)')
byRetention.forEach((v, i) => {
  const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
  console.log(`${medal} ${v.adName}`)
  console.log(`   Campanha: ${v.campName}`)
  console.log(`   Alcance: ${fmt(v.reach)} | Ret.25%: ${pct(v.p25, v.reach)} | Ret.50%: ${pct(v.p50, v.reach)} | Ret.95%: ${pct(v.p95, v.reach)}`)
  console.log(`   Visitas: ${fmt(v.clicks)} | CTR: ${v.ctr.toFixed(2)}% | Gasto: ${fmt(v.spend, 'currency')}`)
  console.log(`   ${v.permalinkUrl ?? '(sem link)'}`)
  console.log()
})

console.log('\n👆 RANKING — VISITAS (link_clicks)')
byClicks.forEach((v, i) => {
  const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
  console.log(`${medal} ${v.adName}`)
  console.log(`   Visitas: ${fmt(v.clicks)} | CTR: ${v.ctr.toFixed(2)}% | Alcance: ${fmt(v.reach)} | Gasto: ${fmt(v.spend, 'currency')}`)
  console.log(`   ${v.permalinkUrl ?? '(sem link)'}`)
  console.log()
})

console.log('\n🎯 RANKING — RESULTADOS (leads + mensagens)')
byResults.forEach((v, i) => {
  const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
  const cpr = v.costPerResult ? fmt(v.costPerResult, 'currency') : '—'
  console.log(`${medal} ${v.adName}`)
  console.log(`   Resultados: ${v.results} (leads: ${v.leads ?? 0}, msgs: ${v.messages ?? 0}) | Custo/resultado: ${cpr}`)
  console.log(`   Visitas: ${fmt(v.clicks)} | Gasto: ${fmt(v.spend, 'currency')}`)
  console.log(`   ${v.permalinkUrl ?? '(sem link)'}`)
  console.log()
})

// Totais
const totalSpend = enriched.reduce((s, v) => s + v.spend, 0)
const totalClicks = enriched.reduce((s, v) => s + v.clicks, 0)
const totalResults = enriched.reduce((s, v) => s + v.results, 0)
console.log('\n📈 TOTAIS DO PERÍODO')
console.log(`   Gasto total: ${fmt(totalSpend, 'currency')}`)
console.log(`   Visitas totais: ${fmt(totalClicks)}`)
console.log(`   Resultados totais: ${totalResults}`)
