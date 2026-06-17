'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PageBanner } from '@/components/page-banner'
import { formatPrice } from '@/lib/products'
import { Package, Truck, CheckCircle, Clock, XCircle, AlertCircle, Loader2 } from 'lucide-react'

interface OrderItem {
  title: string
  quantity: number
  unit_price: number
  description?: string
}

interface Order {
  id: number
  payment_id: string
  payment_type: string
  status: string
  status_envio: string
  tracking_code: string | null
  payer_email: string
  total: number
  items: OrderItem[]
  created_at: string
  cancelamento_solicitado: boolean
}

const STATUS_ENVIO_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  aguardando_envio:  { label: 'Aguardando envio',     icon: Clock,        color: 'text-yellow-600' },
  etiqueta_gerada:   { label: 'Etiqueta gerada',      icon: Package,      color: 'text-blue-600'   },
  postado:           { label: 'Postado nos Correios',  icon: Truck,        color: 'text-blue-700'   },
  a_caminho:         { label: 'A caminho',             icon: Truck,        color: 'text-indigo-600' },
  tentativa_entrega: { label: 'Tentativa de entrega',  icon: AlertCircle, color: 'text-orange-600' },
  entregue:          { label: 'Entregue',              icon: CheckCircle,  color: 'text-green-600'  },
  cancelado:         { label: 'Cancelado',             icon: XCircle,      color: 'text-red-600'    },
}

const STEPS = ['aguardando_envio', 'etiqueta_gerada', 'postado', 'a_caminho', 'entregue']

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_ENVIO_CONFIG[status] ?? { label: status, icon: Package, color: 'text-muted-foreground' }
  const Icon = cfg.icon
  return (
    <span className={`flex items-center gap-1.5 text-sm font-medium ${cfg.color}`}>
      <Icon className="h-4 w-4" />
      {cfg.label}
    </span>
  )
}

function TrackingSteps({ status }: { status: string }) {
  const currentIdx = STEPS.indexOf(status)
  if (currentIdx === -1 || status === 'cancelado') return null
  return (
    <div className="mt-4 flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done = i <= currentIdx
        const cfg = STATUS_ENVIO_CONFIG[step]
        return (
          <div key={step} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <div className={`h-3 w-3 rounded-full border-2 ${done ? 'bg-gold border-gold-dark' : 'bg-background border-border'}`} />
              <span className={`mt-1 text-center text-[10px] leading-tight ${done ? 'text-foreground' : 'text-muted-foreground'}`} style={{ maxWidth: 60 }}>
                {cfg.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mb-4 h-0.5 flex-1 ${i < currentIdx ? 'bg-gold-dark' : 'bg-border'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function BotaoCancelar({ order, onCancelado }: { order: Order; onCancelado: () => void }) {
  const [aberto, setAberto] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const podeCancelar = ['aguardando_envio', 'etiqueta_gerada'].includes(order.status_envio)
    && order.status !== 'cancelled'
    && !order.cancelamento_solicitado

  if (!podeCancelar && !order.cancelamento_solicitado) return null

  if (order.cancelamento_solicitado) {
    return (
      <div className="mt-4 border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
        Cancelamento solicitado — aguardando análise da loja.
      </div>
    )
  }

  async function solicitarCancelamento() {
    setLoading(true)
    setErro(null)
    try {
      const res = await fetch('/api/pedidos/cancelar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: order.payment_id, motivo }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao solicitar cancelamento.')
      } else {
        setAberto(false)
        onCancelado()
      }
    } catch {
      setErro('Erro ao solicitar cancelamento.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4">
      {!aberto ? (
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="text-xs uppercase tracking-widest text-red-600 underline hover:no-underline"
        >
          Solicitar cancelamento
        </button>
      ) : (
        <div className="border border-border p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Motivo do cancelamento</p>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Descreva o motivo (opcional)"
            rows={3}
            className="w-full border border-border bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none resize-none"
          />
          {erro && <p className="text-xs text-red-600">{erro}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={solicitarCancelamento}
              disabled={loading}
              className="flex items-center gap-2 bg-red-600 px-4 py-2 text-xs uppercase tracking-widest text-white hover:bg-red-700 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-3 w-3 animate-spin" />}
              Confirmar
            </button>
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="px-4 py-2 text-xs uppercase tracking-widest text-muted-foreground border border-border hover:border-foreground"
            >
              Voltar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MeusPedidosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  function carregarPedidos() {
    fetch('/api/pedidos')
      .then((r) => r.json())
      .then((data) => { setOrders(data.orders ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login?callbackUrl=/meus-pedidos')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    carregarPedidos()
  }, [status])

  if (status === 'loading' || loading) {
    return (
      <>
        <SiteHeader />
        <main className="min-h-screen">
          <PageBanner title="Meus Pedidos" breadcrumb={[{ label: 'Início', href: '/' }, { label: 'Meus Pedidos' }]} />
          <div className="flex items-center justify-center py-32">
            <p className="font-serif text-xl text-muted-foreground">Carregando pedidos...</p>
          </div>
        </main>
        <SiteFooter />
      </>
    )
  }

  return (
    <>
      <SiteHeader />
      <main>
        <PageBanner title="Meus Pedidos" breadcrumb={[{ label: 'Início', href: '/' }, { label: 'Meus Pedidos' }]} />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-14">
          {orders.length === 0 ? (
            <div className="py-20 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="mt-4 font-serif text-2xl text-foreground">Nenhum pedido encontrado</p>
              <p className="mt-2 text-sm font-light text-muted-foreground">Suas compras aparecerão aqui após o pagamento.</p>
              <Link href="/produtos" className="mt-8 inline-block bg-foreground px-8 py-4 text-xs uppercase tracking-widest text-background transition-colors hover:bg-gold-gradient hover:text-gold-foreground">
                Ver produtos
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {orders.map((order) => (
                <div key={order.id} className="border border-border p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">Pedido #{order.payment_id}</p>
                      <p className="mt-0.5 text-xs font-light text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-medium text-foreground">{formatPrice(Number(order.total))}</p>
                      <StatusBadge status={order.status_envio} />
                    </div>
                  </div>

                  <TrackingSteps status={order.status_envio} />

                  {order.tracking_code && (
                    <div className="mt-4 border border-border bg-accent/30 px-4 py-3">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">Código de rastreio</p>
                      <a
                        href={`https://www.linkcorreios.com.br/${order.tracking_code}`}
                        target="_blank" rel="noopener noreferrer"
                        className="mt-0.5 font-mono text-sm text-foreground underline decoration-gold hover:text-gold-dark"
                      >
                        {order.tracking_code}
                      </a>
                    </div>
                  )}

                  {order.status_envio === 'cancelado' && (
                    <div className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      Este pedido foi cancelado.
                    </div>
                  )}

                  <div className="mt-5 divide-y divide-border">
                    {(order.items ?? []).map((item, i) => (
                      <div key={i} className="flex justify-between py-3 text-sm">
                        <div>
                          <p className="font-medium text-foreground">{item.title}</p>
                          {item.description && <p className="text-xs font-light text-muted-foreground">{item.description}</p>}
                          <p className="text-xs font-light text-muted-foreground">Qtd: {item.quantity}</p>
                        </div>
                        <p className="shrink-0 text-foreground">{formatPrice(item.unit_price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>

                  <BotaoCancelar order={order} onCancelado={carregarPedidos} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
