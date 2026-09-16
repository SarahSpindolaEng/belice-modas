'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

declare global {
  interface Window { MercadoPago?: any }
}

const VALORES = [
  { valor: 0.1, label: 'R$ 0,10' },
  { valor: 1, label: 'R$ 1,00' },
  { valor: 5, label: 'R$ 5,00' },
]

const STATUS_PT: Record<string, string> = {
  approved: 'Aprovado ✅',
  in_process: 'Em análise ⏳',
  pending: 'Pendente ⏳',
  rejected: 'Recusado ❌',
}

function loadSdk(): Promise<void> {
  if (window.MercadoPago) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://sdk.mercadopago.com/js/v2'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Falha ao carregar o SDK do Mercado Pago'))
    document.body.appendChild(s)
  })
}

export default function TestePagamento({ publicKey }: { publicKey: string }) {
  const { data: session } = useSession()
  const [valor, setValor] = useState(0.1)
  const [erro, setErro] = useState<string | null>(null)
  const [resultado, setResultado] = useState<{ id?: number; status?: string; status_detail?: string } | null>(null)
  const controllerRef = useRef<any>(null)
  const valorRef = useRef(valor)
  valorRef.current = valor

  useEffect(() => {
    if (!publicKey) {
      setErro('MP_PUBLIC_KEY não configurada na Vercel.')
      return
    }
    if (resultado) return
    let cancelado = false

    ;(async () => {
      try {
        await loadSdk()
        if (cancelado) return
        await controllerRef.current?.unmount?.()
        const mp = new window.MercadoPago(publicKey, { locale: 'pt-BR' })
        controllerRef.current = await mp.bricks().create('cardPayment', 'cardPaymentBrick_container', {
          initialization: { amount: valor },
          customization: { paymentMethods: { maxInstallments: 1 } },
          callbacks: {
            onReady: () => {},
            onError: (e: any) => setErro(e?.message ?? 'Erro no formulário de cartão.'),
            onSubmit: (formData: any) =>
              new Promise<void>((resolve, reject) => {
                setErro(null)
                fetch('/api/admin/teste-pagamento', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ valor: valorRef.current, formData }),
                })
                  .then((r) => r.json())
                  .then((d) => {
                    if (d.error) {
                      setErro(d.error)
                      reject()
                    } else {
                      setResultado(d)
                      resolve()
                    }
                  })
                  .catch(() => {
                    setErro('Erro de conexão.')
                    reject()
                  })
              }),
          },
        })
      } catch (e: any) {
        setErro(e?.message ?? 'Erro ao carregar o pagamento.')
      }
    })()

    return () => {
      cancelado = true
      controllerRef.current?.unmount?.()
    }
  }, [publicKey, valor, resultado])

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4 py-10">
      <div className="w-full max-w-lg border border-border bg-background p-8">
        <h1 className="font-serif text-3xl text-foreground">Pagamento de teste</h1>
        <div className="mt-2 h-px w-12 bg-gold-gradient" />

        <p className="mt-6 text-sm font-light text-muted-foreground">
          Cobrança real no cartão, pela API do Mercado Pago, <strong>sem frete</strong>.
          O pedido fica no nome de <strong>{session?.user?.email ?? '...'}</strong> e deve aparecer
          como pago no Painel de Pedidos. Use &quot;Negar&quot; lá para testar o reembolso.
        </p>

        {!resultado && (
          <>
            <div className="mt-6 flex gap-2">
              {VALORES.map((v) => (
                <button
                  key={v.valor}
                  type="button"
                  onClick={() => setValor(v.valor)}
                  className={
                    'flex-1 border px-3 py-2 text-xs uppercase tracking-widest ' +
                    (valor === v.valor ? 'border-gold bg-accent/50 text-foreground' : 'border-border text-muted-foreground')
                  }
                >
                  {v.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs font-light text-muted-foreground">
              Se o Mercado Pago recusar R$ 0,10 por valor mínimo, escolha R$ 1,00.
            </p>
            <div id="cardPaymentBrick_container" className="mt-6" />
          </>
        )}

        {resultado && (
          <div className="mt-6 border border-border p-4 text-sm">
            <p><strong>Status:</strong> {STATUS_PT[resultado.status ?? ''] ?? resultado.status}</p>
            <p className="mt-1 text-muted-foreground">Detalhe: {resultado.status_detail}</p>
            <p className="mt-1 text-muted-foreground">ID do pagamento: {resultado.id}</p>
            <button
              type="button"
              onClick={() => { setResultado(null); setErro(null) }}
              className="mt-4 text-xs uppercase tracking-widest underline"
            >
              Fazer outro teste
            </button>
          </div>
        )}

        {erro && <p className="mt-4 text-sm text-red-600">{erro}</p>}

        <div className="mt-8 border-t border-border pt-6">
          <Link href="/admin/pedidos" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-gold-dark">
            ← Painel de pedidos
          </Link>
        </div>
      </div>
    </div>
  )
}
