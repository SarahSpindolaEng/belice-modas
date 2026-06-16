import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { loadToken } from '@/lib/me-token'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase())

export default async function SetupPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const session = await auth()

  // Bloqueia acesso se não estiver logado ou não for admin
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
    redirect('/login?callbackUrl=/admin/setup')
  }

  const token = loadToken()
  const connected = !!token
  const justConnected = searchParams.status === 'ok'

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
      <div className="w-full max-w-md border border-border bg-background p-8">
        <h1 className="font-serif text-3xl text-foreground">Configuração</h1>
        <div className="mt-2 h-px w-12 bg-gold-gradient" />

        <div className="mt-8 space-y-6">
          <div className="border border-border p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-foreground">Melhor Envio</h2>
              {connected ? (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                  Conectado ✓
                </span>
              ) : (
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
                  Não conectado
                </span>
              )}
            </div>

            {justConnected && (
              <p className="mt-3 text-sm text-green-700 font-light">
                Autorização realizada com sucesso! O frete já está funcionando.
              </p>
            )}

            {!connected && (
              <p className="mt-3 text-sm font-light text-muted-foreground">
                Conecte sua conta Melhor Envio para calcular o frete automaticamente.
              </p>
            )}

            <a
              href="/api/melhorenvio"
              className="mt-4 inline-flex items-center justify-center gap-2 bg-foreground px-5 py-3 text-xs uppercase tracking-widest text-background transition-colors hover:bg-gold-gradient hover:text-gold-foreground w-full text-center"
            >
              {connected ? 'Reconectar Melhor Envio' : 'Conectar Melhor Envio'}
            </a>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <Link
            href="/"
            className="text-xs uppercase tracking-widest text-muted-foreground hover:text-gold-dark transition-colors"
          >
            ← Voltar ao site
          </Link>
        </div>
      </div>
    </div>
  )
}
