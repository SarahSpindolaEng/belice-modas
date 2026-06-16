'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { useCart } from '@/components/cart-context'
import { useEffect, Suspense } from 'react'

function ConfirmacaoContent() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status')
  const { clearCart } = useCart()

  useEffect(() => {
    if (status === 'approved') {
      clearCart()
    }
  }, [status, clearCart])

  const config = {
    approved: {
      icon: <CheckCircle className="h-16 w-16 text-green-500" />,
      title: 'Pedido confirmado!',
      message: 'Seu pagamento foi aprovado. Em breve voce recebera a confirmacao por email.',
      color: 'text-green-600',
    },
    pending: {
      icon: <Clock className="h-16 w-16 text-yellow-500" />,
      title: 'Pagamento em analise',
      message: 'Seu pagamento esta sendo processado. Assim que confirmado, seu pedido sera enviado.',
      color: 'text-yellow-600',
    },
    failure: {
      icon: <XCircle className="h-16 w-16 text-red-500" />,
      title: 'Pagamento nao aprovado',
      message: 'Houve um problema com seu pagamento. Tente novamente ou escolha outra forma de pagamento.',
      color: 'text-red-600',
    },
  }[status ?? 'failure'] ?? {
    icon: <XCircle className="h-16 w-16 text-red-500" />,
    title: 'Pagamento nao aprovado',
    message: 'Houve um problema com seu pagamento. Tente novamente.',
    color: 'text-red-600',
  }

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
      {config.icon}
      <h1 className="mt-6 font-serif text-3xl text-foreground">{config.title}</h1>
      <p className="mt-3 max-w-sm font-light text-muted-foreground">{config.message}</p>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        {status !== 'approved' && (
          <Link
            href="/carrinho"
            className="bg-foreground px-8 py-4 text-xs uppercase tracking-widest text-background transition-colors hover:bg-gold-dark"
          >
            Voltar ao carrinho
          </Link>
        )}
        <Link
          href="/produtos"
          className="border border-foreground px-8 py-4 text-xs uppercase tracking-widest text-foreground transition-colors hover:border-gold hover:text-gold-dark"
        >
          Continuar comprando
        </Link>
      </div>
    </main>
  )
}

export default function ConfirmacaoPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Carregando...</div>}>
        <ConfirmacaoContent />
      </Suspense>
      <SiteFooter />
    </>
  )
}
