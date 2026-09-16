/**
 * GET /api/auth/me/callback
 * Handles Melhor Envio OAuth2 callback, exchanges code for token
 */

import { NextRequest, NextResponse } from 'next/server'
import { getMEBase, saveToken } from '@/lib/me-token'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/admin-emails'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error || !code) {
    return NextResponse.json(
      { error: 'Autorização não concluída.' },
      { status: 400 },
    )
  }

  // Validacao anti-CSRF: o state recebido tem que bater com o cookie definido no inicio do fluxo.
  const state = req.nextUrl.searchParams.get('state')
  const expectedState = req.cookies.get('me_oauth_state')?.value
  if (!state || !expectedState || state !== expectedState) {
    return NextResponse.json(
      { error: 'Parâmetro state inválido (possível CSRF). Reinicie a conexão.' },
      { status: 400 },
    )
  }

  const base = getMEBase()

  try {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.MELHOR_ENVIO_CLIENT_ID!,
      client_secret: process.env.MELHOR_ENVIO_CLIENT_SECRET!,
      redirect_uri: process.env.MELHOR_ENVIO_REDIRECT_URI!,
      code,
    })

    const res = await fetch(`${base}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'User-Agent': 'BeliceModas/1.0 (belicemodas6@gmail.com)',
      },
      body: body.toString(),
    })

    if (!res.ok) {
      console.error('Melhor Envio OAuth falhou:', res.status, await res.text())
      return NextResponse.json({ error: 'Falha ao conectar com o Melhor Envio.' }, { status: 502 })
    }

    const data = await res.json()
    saveToken(data)

    // Redirect to admin setup page with success
    const appUrl = process.env.APP_URL ?? 'http://localhost:3000'
    return NextResponse.redirect(`${appUrl}/admin/setup?status=ok`)
  } catch (err) {
    console.error('Melhor Envio OAuth erro:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
