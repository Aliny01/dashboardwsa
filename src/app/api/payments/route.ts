import { NextResponse } from 'next/server'
import { fetchAllPayments } from '@/lib/payments-api'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const rows = await fetchAllPayments()
    return NextResponse.json({ rows, fetchedAt: new Date().toISOString() })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[Payments API Route]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
