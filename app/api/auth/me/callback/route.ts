import { NextRequest, NextResponse } from 'next/server'
export async function GET(req: NextRequest) {
  const url = new URL('/api/melhorenvio/callback', process.env.APP_URL ?? 'http://localhost:3000')
  req.nextUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v))
  return NextResponse.redirect(url)
}
