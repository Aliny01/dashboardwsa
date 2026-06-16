import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf-8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()])
)

console.log('\n── Credenciais carregadas ──────────────────')
console.log('CLIENT_ID  :', env.GOOGLE_ADS_CLIENT_ID?.slice(0, 20) + '...')
console.log('SECRET     :', env.GOOGLE_ADS_CLIENT_SECRET?.slice(0, 10) + '...')
console.log('REFRESH    :', env.GOOGLE_ADS_REFRESH_TOKEN?.slice(0, 20) + '...')
console.log('CUSTOMER   :', env.GOOGLE_ADS_CUSTOMER_ID)
console.log('DEV TOKEN  :', env.GOOGLE_ADS_DEVELOPER_TOKEN?.slice(0, 10) + '...')

console.log('\n── Testando troca do refresh token ─────────')
const body = new URLSearchParams({
  client_id: env.GOOGLE_ADS_CLIENT_ID,
  client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
  refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
  grant_type: 'refresh_token',
})

const res = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  body,
})

const data = await res.json()

if (data.access_token) {
  console.log('✅ Token válido! access_token obtido.')
  console.log('   Expira em:', data.expires_in, 'segundos')
  console.log('   Escopo   :', data.scope)
} else {
  console.log('❌ Falhou:', data.error, '-', data.error_description)
}
