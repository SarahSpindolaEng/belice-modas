import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware leve — verifica apenas a presença do cookie de sessão.
 * A verificação real (email admin) é feita no layout server-side e nas APIs,
 * que usam await auth() com verificação completa do JWT.
 *
 * Usar auth() do NextAuth no Edge pode causar loop de redirect quando
 * o cookie ainda não está disponível logo após o login.
 */

const SESSION_COOKIE = [
  '__Secure-authjs.session-token',
  'authjs.session-token',
  '__Secure-next-auth.session-token',
  'next-auth.session-token',
]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Só age em rotas admin
  const isAdminPage = pathname.startsWith('/admin')
  const isAdminApi = pathname.startsWith('/api/admin')
  if (!isAdminPage && !isAdminApi) return NextResponse.next()

  // Verifica presença de qualquer cookie de sessão válido
  const hasSession = SESSION_COOKIE.some((name) => req.cookies.has(name))

  if (!hasSession) {
    if (isAdminApi) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Sessão presente → passa. O layout e as APIs fazem a verificação completa.
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
