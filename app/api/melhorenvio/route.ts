/**
 * GET /api/auth/me
 * Redirects to Melhor Envio OAuth2 authorization page
 */

import { NextResponse } from 'next/server'
import { getMEBase } from '@/lib/me-token'

export async function GET() {
  const base = getMEBase()
  const params = new URLSearchParams({
    client_id: process.env.MELHOR_ENVIO_CLIENT_ID!,
    redirect_uri: process.env.MELHOR_ENVIO_REDIRECT_URI!,
    response_type: 'code',
    scope: 'shipping-calculate shipping-generate shipping-preview shipping-print shipping-tracking cart-read',
  })

  return NextResponse.redirect(`${base}/oauth/authorize?${params}`)
}
