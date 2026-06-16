import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  return new NextResponse(`
    <html><body style="font-family:monospace;padding:40px;background:#111;color:#0f0">
      <h2 style="color:#fff">✅ Código OAuth recebido!</h2>
      <p style="color:#aaa">Copie o código abaixo e cole no terminal:</p>
      <textarea style="width:100%;height:120px;background:#222;color:#0f0;padding:12px;font-size:13px;border:1px solid #444">${code}</textarea>
    </body></html>
  `, { headers: { 'Content-Type': 'text/html' } })
}
