'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'

const VALORES = [
  { valor: 0.1, label: 'R$ 0,10' },
  { valor: 1, label: 'R$ 1,00' },
  { valor: 5, label: 'R$ 5,00' },
]

export default function TestePagamentoPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState<number | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  async function criar(valor: number) {
    setLoading(valor)
    setErro(null)
    try {
      const res = await fetch('/api/admin/teste-pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor }),
      })
      const data = await res.json().catch(() => ({}))
      if (data.init_point) {
        window.location.href = data.init_point
        return
      }
      setErro(data.error ?? 'Erro ao criar o pedido de teste.')
    } catch {
      setErro('Erro de conexão.')
    }
    setLoading(null)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
      <div className="w-full max-w-md border border-border bg-background p-8">
        <h1 className="font-serif text-3xl text-foreground">Pedido de teste</h1>
        <div className="mt-2 h-px w-12 bg-gold-gradient" />

        <p className="mt-6 text-sm font-light text-muted-foreground">
          Leva para a <strong>mesma tela de pagamento do Mercado Pago</strong> que o cliente vê ao clicar
          em &quot;Pagar&quot;, com um item de valor simbólico e <strong>sem frete</strong> (retirada), no nome de{' '}
          <strong>{session?.user?.email ?? '...'}</strong>. Depois de pagar, o pedido deve aparecer como pago
          no Painel de Pedidos. Use &quot;Negar&quot; lá para testar o reembolso.
        </p>
        <p className="mt-3 text-xs font-light text-muted-foreground">
          Pague com um cartão/conta diferente da conta Mercado Pago da loja.
          Se o Mercado Pago recusar R$ 0,10 por valor mínimo, tente R$ 1,00.
        </p>

        <div className="mt-6 grid gap-3">
          {VALORES.map((v) => (
            <button
              key={v.valor}
              type="button"
              onClick={() => criar(v.valor)}
              disabled={loading !== null}
              className="flex items-center justify-center gap-2 bg-foreground px-5 py-3 text-xs uppercase tracking-widest text-background transition-colors hover:bg-gold-gradient hover:text-gold-foreground disabled:opacity-60"
            >
              {loading === v.valor ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Pagar {v.label} (teste)
            </button>
          ))}
        </div>

        {erro && <p className="mt-4 text-sm text-red-600">{erro}</p>}

        <div className="mt-8 border-t border-border pt-6 flex justify-between">
          <Link href="/admin/pedidos" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-gold-dark">
            ← Painel de pedidos
          </Link>
        </div>
      </div>
    </div>
  )
}
