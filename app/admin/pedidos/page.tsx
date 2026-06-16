'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { formatPrice } from '@/lib/products'
import { Package, Truck, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'

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
  endereco: string | null
  total: number
  items: OrderItem[]
  created_at: string
}

const STATUS_ENVIO_LABEL: Record<string, { label: string; color: string }> = {
  aguardando_envio:  { label: 'Aguardando envio',    color: 'bg-yellow-100 text-yellow-800' },
  etiqueta_gerada:   { label: 'Etiqueta gerada',     color: 'bg-blue-100 text-blue-800'    },
  postado:           { label: 'Postado',              color: 'bg-indigo-100 text-indigo-800'},
  a_caminho:         { label: 'A caminho',            color: 'bg-purple-100 text-purple-800'},
  tentativa_entrega: { label: 'Tentativa entrega',   color: 'bg-orange-100 text-orange-800'},
  entregue:          { label: 'Entregue',             color: 'bg-green-100 text-green-800'  },
  cancelado:         { label: 'Cancelado',            color: 'bg-red-100 text-red-800'      },
}

export default function AdminPedidosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/pedidos')
      return
    }
    if (status === 'authenticated') {
      fetch('/api/admin/pedidos')
        .then((r) => r.json())
        .then((d) => {
          if (d.error) { router.push('/'); return }
          setOrders(d.orders ?? [])
        })
        .finally(() => setLoading(false))
    }
  }, [status, router])

  const pedidosFiltrados = orders.filter((o) => {
    if (!busca) return true
    const q = busca.toLowerCase()
    return (
      o.payer_email?.toLowerCase().includes(q) ||
      o.payment_id?.toLowerCase().includes(q) ||
      o.tracking_code?.toLowerCase().includes(q) ||
      o.endereco?.toLowerCase().includes(q)
    )
  })

  const totalGeral = orders.reduce((s, o) => s + Number(o.total), 0)

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl text-foreground">Painel de Pedidos</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {orders.length} pedido{orders.length !== 1 ? 's' : ''} · Total: {formatPrice(totalGeral)}
            </p>
          </div>
          <input
            type="text"
            placeholder="Buscar por email, ID ou rastreio..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="border border-border bg-background px-4 py-2 text-sm focus:border-gold focus:outline-none sm:w-72"
          />
        </div>

        {loading ? (
          <div className="py-20 text-center text-muted-foreground">Carregando pedidos...</div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">Nenhum pedido encontrado.</div>
        ) : (
          <div className="space-y-4">
            {pedidosFiltrados.map((order) => {
              const envio = STATUS_ENVIO_LABEL[order.status_envio] ?? { label: order.status_envio, color: 'bg-gray-100 text-gray-800' }
              const data = new Date(order.created_at).toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })

              return (
                <div key={order.id} className="border border-border bg-background p-5">
                  {/* cabeçalho */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Pedido #{order.id} · {data}</p>
                      <p className="mt-0.5 font-medium text-foreground">{order.payer_email}</p>
                      {order.endereco && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{order.endereco}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${envio.color}`}>
                        {envio.label}
                      </span>
                      <span className="text-lg font-serif font-medium text-foreground">
                        {formatPrice(Number(order.total))}
                      </span>
                    </div>
                  </div>

                  {/* itens */}
                  <div className="mt-4 border-t border-border pt-4">
                    <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Itens</p>
                    <div className="space-y-1">
                      {(Array.isArray(order.items) ? order.items : []).map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-foreground">
                            {item.title}
                            {item.description ? <span className="text-muted-foreground"> · {item.description}</span> : null}
                            {' '}× {item.quantity}
                          </span>
                          <span className="text-muted-foreground">{formatPrice(item.unit_price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* rastreio e pagamento */}
                  <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
                    <span>ID: <span className="font-mono text-foreground">{order.payment_id}</span></span>
                    <span>Pagamento: <span className="text-foreground">{order.payment_type ?? '—'}</span></span>
                    {order.tracking_code && (
                      <span>
                        Rastreio:{' '}
                        <a
                          href={`https://www.linkcorreios.com.br/?id=${order.tracking_code}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-gold-dark underline"
                        >
                          {order.tracking_code}
                        </a>
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  )
}
