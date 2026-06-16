import { NextResponse } from 'next/server'
export async function GET() {
  return NextResponse.redirect(new URL('/api/melhorenvio', process.env.APP_URL ?? 'http://localhost:3000'))
}
