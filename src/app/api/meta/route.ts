import { NextResponse } from 'next/server'
import { fetchMetaDashboard, fetchAdCreatives } from '@/lib/meta-api'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since')
    const until = searchParams.get('until')
    const days = parseInt(searchParams.get('days') ?? '7', 10)
    const withCreatives = searchParams.get('creatives') === 'true'

    const rangeOrDays = since && until ? { since, until } : days

    const data = await fetchMetaDashboard(rangeOrDays)

    if (withCreatives) {
      const activeCampaigns = data.campaigns
        .filter((c) => c.spend > 0)
        .map((c) => ({ id: c.id, name: c.name }))
      const creatives = await fetchAdCreatives(activeCampaigns, since ?? undefined, until ?? undefined)
      return NextResponse.json({ ...data, creatives })
    }

    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[Meta API Route]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
