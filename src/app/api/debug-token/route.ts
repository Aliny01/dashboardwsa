import { NextResponse } from 'next/server'

export async function GET() {
  const token = process.env.META_ACCESS_TOKEN ?? ''
  return NextResponse.json({
    starts: token.substring(0, 10),
    ends: token.slice(-6),
    length: token.length,
  })
}
