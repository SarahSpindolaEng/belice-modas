import { NextRequest, NextResponse } from 'next/server'
export async function GET(req: NextRequest) {
  const url = new URL('/api/melhorenvio/callback', process.env.APP_URL ?? 'http://localhost:3000')
  for (const k of ['code', 'state', 'error']) {
    const v = req.nextUrl.searchParams.get(k)
    if (v) url.searchParams.set(k, v.slice(0, 500))
  }
  return NextResponse.redirect(url)
}
