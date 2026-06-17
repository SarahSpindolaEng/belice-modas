import { auth } from '@/auth'
import { NextResponse } from 'next/server'

const PROTECTED_PATHS = ['/admin', '/api/admin']

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAdminPath = PROTECTED_PATHS.some((p) => pathname.startsWith(p))

  if (!isAdminPath) return NextResponse.next()

  // 1. Deve estar autenticado
  const session = req.auth
  if (!session?.user?.email) {
    // API → 401, página → redireciona para login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 2. Deve ser admin
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())

  if (!adminEmails.includes(session.user.email.toLowerCase())) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
})

export const config = {
  // Protege /admin/* e /api/admin/* na borda (Edge Runtime)
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
