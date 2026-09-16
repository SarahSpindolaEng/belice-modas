/**
 * GET /api/auth/me
 * Redirects to Melhor Envio OAuth2 authorization page
 */

import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { getMEBase } from '@/lib/me-token'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/admin-emails'

export async function GET() {
  // Somente admin pode iniciar a conexão com o Melhor Envio
  const session = await auth()
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const base = getMEBase()
  // Token anti-CSRF: gerado aqui, guardado em cookie httpOnly e validado no callback.
  const state = randomBytes(16).toString('hex')
  const params = new URLSearchParams({
    client_id: process.env.MELHOR_ENVIO_CLIENT_ID!,
    redirect_uri: process.env.MELHOR_ENVIO_REDIRECT_URI!,
    response_type: 'code',
    scope: 'shipping-calculate shipping-generate shipping-preview shipping-print shipping-tracking cart-read',
    state,
  })

  const res = NextResponse.redirect(`${base}/oauth/authorize?${params}`)
  res.cookies.set('me_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })
  return res
}
