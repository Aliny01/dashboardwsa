import { google } from 'googleapis'
import * as readline from 'readline'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf-8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.split('=')[0].trim(), l.slice(l.indexOf('=') + 1).trim()])
)

const oauth2Client = new google.auth.OAuth2(
  env.GOOGLE_ADS_CLIENT_ID,
  env.GOOGLE_ADS_CLIENT_SECRET,
  'http://localhost:3000/api/auth/callback'
)

const url = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/adwords'],
  prompt: 'consent',
})

console.log('\n✅ Acesse esta URL no navegador:\n')
console.log(url)
console.log('\nDepois cole aqui o código que aparecer na URL após o login:')

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
rl.question('\nCódigo: ', async (code) => {
  const { tokens } = await oauth2Client.getToken(code)
  console.log('\n✅ Seu Refresh Token:\n')
  console.log(tokens.refresh_token)
  console.log('\nCopie e cole no .env.local como GOOGLE_ADS_REFRESH_TOKEN')
  rl.close()
})
