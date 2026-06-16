const res = await fetch('http://localhost:3000/api/meta?since=2026-05-01&until=2026-05-31&creatives=true')
const data = await res.json()

const videos = data.creatives.filter((c) => c.type === 'video' && c.spend > 0)

function score(c) {
  const results = (c.leads || 0) + (c.messages || 0)
  const ctr = c.reach > 0 ? c.clicks / c.reach : 0
  const retention = c.reach > 0 ? (c.video_p95 || 0) / c.reach : 0
  return { results, ctr, retention }
}

const enriched = videos.map((c) => ({ ...c, ...score(c) }))

console.log(`Total de vídeos com investimento em maio/2026: ${enriched.length}\n`)

console.log('--- Top 3 por RESULTADOS (leads + mensagens) ---')
;[...enriched].sort((a, b) => b.results - a.results).slice(0, 3).forEach((c, i) => {
  console.log(`${i + 1}. ${c.adName}`)
  console.log(`   Campanha: ${c.campaignId} | Resultados: ${c.results} | Cliques: ${c.clicks} | Alcance: ${c.reach} | Gasto: R$ ${c.spend.toFixed(2)}`)
  console.log(`   ${c.permalinkUrl ?? '(sem permalink)'}`)
})

console.log('\n--- Top 3 por CTR (cliques/alcance) ---')
;[...enriched].sort((a, b) => b.ctr - a.ctr).slice(0, 3).forEach((c, i) => {
  console.log(`${i + 1}. ${c.adName}`)
  console.log(`   CTR: ${(c.ctr * 100).toFixed(2)}% | Cliques: ${c.clicks} | Alcance: ${c.reach} | Gasto: R$ ${c.spend.toFixed(2)}`)
  console.log(`   ${c.permalinkUrl ?? '(sem permalink)'}`)
})

console.log('\n--- Top 3 por RETENÇÃO DE VÍDEO (p95/alcance) ---')
;[...enriched].sort((a, b) => b.retention - a.retention).slice(0, 3).forEach((c, i) => {
  console.log(`${i + 1}. ${c.adName}`)
  console.log(`   Retenção 95%: ${(c.retention * 100).toFixed(2)}% | Visualizações 95%: ${c.video_p95} | Alcance: ${c.reach} | Gasto: R$ ${c.spend.toFixed(2)}`)
  console.log(`   ${c.permalinkUrl ?? '(sem permalink)'}`)
})
