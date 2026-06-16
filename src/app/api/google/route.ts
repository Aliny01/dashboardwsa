import { NextResponse } from 'next/server'
import { fetchGoogleDashboard } from '@/lib/google-api'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since')
    const until = searchParams.get('until')
    const days = parseInt(searchParams.get('days') ?? '7', 10)

    const rangeOrDays = since && until ? { since, until } : days

    const data = await fetchGoogleDashboard(rangeOrDays)
    return NextResponse.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[Google API Route]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
