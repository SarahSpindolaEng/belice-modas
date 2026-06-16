'use client'

import Image from 'next/image'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import Link from 'next/link'

function LoginForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/'
  const error = searchParams.get('error')
  const [loading, setLoading] = useState(false)

  async function handleGoogle() {
    setLoading(true)
    await signIn('google', { callbackUrl })
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-10 flex flex-col items-center lg:hidden">
        <span className="font-serif text-3xl tracking-[0.25em] text-foreground uppercase">
          Belice
        </span>
        <span className="text-[9px] uppercase tracking-[0.4em] text-gold-dark">Modas</span>
      </div>

      <h1 className="font-serif text-3xl text-foreground">Bem-vinda de volta</h1>
      <p className="mt-2 text-sm font-light text-muted-foreground">
        Entre na sua conta para continuar
      </p>

      {error && (
        <p className="mt-4 rounded border border-destructive/30 bg-destructive/10 px-4 py-3 text-xs text-destructive">
          Ocorreu um erro ao entrar. Tente novamente.
        </p>
      )}

      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        className="mt-8 flex w-full items-center justify-center gap-3 border border-border py-4 text-sm font-light text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {loading ? 'Entrando...' : 'Continuar com Google'}
      </button>

      <p className="mt-8 text-center text-xs font-light text-muted-foreground leading-relaxed">
        Ao entrar, voce concorda com nossos{' '}
        <Link href="/politicas/termos" className="text-gold-dark hover:underline">
          Termos de Uso
        </Link>{' '}
        e{' '}
        <Link href="/politicas/privacidade" className="text-gold-dark hover:underline">
          Politica de Privacidade
        </Link>
        .
      </p>

      <p className="mt-6 text-center">
        <Link href="/" className="text-xs uppercase tracking-wider text-muted-foreground hover:text-gold-dark transition-colors">
          Voltar a loja
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* lado esquerdo - imagem */}
      <div className="relative hidden w-1/2 lg:block">
        <Image
          src="/banner-login.jpg"
          alt="Belice Modas"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-foreground/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
          <span className="font-serif text-5xl tracking-[0.25em] text-background uppercase">
            Belice
          </span>
          <span className="mt-1 text-xs uppercase tracking-[0.4em] text-gold">Modas</span>
          <div className="mt-6 h-px w-12 bg-gold-gradient" />
          <p className="mt-6 max-w-xs font-light leading-relaxed text-background/80">
            Elegancia, sofisticacao e exclusividade em cada peca.
          </p>
        </div>
      </div>

      {/* lado direito - formulario */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <Suspense fallback={<div className="text-sm text-muted-foreground">Carregando...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
