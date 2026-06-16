import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { metaData, googleData, period } = body

    const prompt = `Você é um analista sênior de tráfego pago da agência WSA. Analise os dados abaixo do período ${period.since} até ${period.until} e gere uma análise objetiva, profissional e útil para apresentar ao cliente.

DADOS META ADS:
${JSON.stringify(metaData, null, 2)}

DADOS GOOGLE ADS:
${JSON.stringify(googleData, null, 2)}

Gere uma análise dividida em 4 seções curtas (use markdown):

## 📊 Resumo da Semana
2-3 frases destacando o resultado principal.

## ✅ O que funcionou
3 pontos com bullets sobre o que teve melhor desempenho (com números específicos).

## ⚠️ Pontos de atenção
2-3 pontos com bullets sobre o que precisa melhorar.

## 🚀 Recomendações
3 ações concretas para a próxima semana (campanhas para escalar, pausar, ajustar verba etc).

Seja específica com números, nomes de campanhas e percentuais. Linguagem profissional mas acessível. Não use jargão excessivo. Máximo 400 palavras totais.`

    const message = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content
      .filter((b) => b.type === 'text')
      .map((b: any) => b.text)
      .join('\n')

    return NextResponse.json({ analysis: text })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao gerar análise'
    console.error('[Analyze]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
