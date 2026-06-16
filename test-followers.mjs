const res = await fetch('http://localhost:3000/api/meta?since=2026-04-10&until=2026-06-08&creatives=true')
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

const active = data.campaigns.filter((c) => c.status === 'ACTIVE' && matches(c.name))

console.log(`Campanhas ativas de seguidores: ${active.length}\n`)

for (const c of active) {
  console.log(`=== ${c.name} (id=${c.id}) — R$ ${c.spend.toFixed(2)} ===`)
  const ads = data.creatives.filter((cr) => cr.campaignId === c.id)
  if (!ads.length) console.log('  (sem criativos retornados)')
  for (const ad of ads) {
    console.log(`  - ${ad.adName} [${ad.type}]`)
    console.log(`    ${ad.permalinkUrl ?? '(sem permalink)'}`)
  }
  console.log()
}
