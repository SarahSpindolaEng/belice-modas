'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { formatPrice } from '@/lib/products'
import { Loader2 } from 'lucide-react'

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
  cancelamento_solicitado: boolean
  cancelamento_motivo: string | null
  cancelamento_data: string | null
  aceito: boolean
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

function BotoesAceite({
  order,
  onAtualizado,
}: {
  order: Order
  onAtualizado: () => void
}) {
  const [loading, setLoading] = useState<'aceitar' | 'negar' | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  async function agir(acao: 'aceitar' | 'negar') {
    if (acao === 'negar' && !confirm('Negar este pedido vai cancelar e reembolsar a cliente. Confirmar?')) return
    setLoading(acao)
    setAviso(null)
    try {
      const res = await fetch('/api/admin/pedidos/acao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: order.payment_id, acao }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAviso(data.error ?? 'Erro.')
      } else {
        if (data.aviso) setAviso(`Aviso reembolso: ${data.aviso}`)
        onAtualizado()
      }
    } catch {
      setAviso('Erro de conexão.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="mt-4 border border-gold bg-accent/30 p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-foreground mb-3">
        Pedido pago — aguardando sua aprovação
      </p>
      {aviso && <p className="mb-2 text-xs text-red-700">{aviso}</p>}
      <div className="flex gap-3">
        <button
          type="button"
          disabled={!!loading}
          onClick={() => agir('aceitar')}
          className="flex items-center gap-1.5 bg-foreground px-4 py-2 text-xs uppercase tracking-widest text-background hover:bg-gold-gradient hover:text-gold-foreground disabled:opacity-60"
        >
          {loading === 'aceitar' && <Loader2 className="h-3 w-3 animate-spin" />}
          Aceitar pedido
        </button>
        <button
          type="button"
          disabled={!!loading}
          onClick={() => agir('negar')}
          className="flex items-center gap-1.5 border border-red-300 px-4 py-2 text-xs uppercase tracking-widest text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          {loading === 'negar' && <Loader2 className="h-3 w-3 animate-spin" />}
          Negar e reembolsar
        </button>
      </div>
    </div>
  )
}

function BotoesReembolso({
  order,
  onAtualizado,
}: {
  order: Order
  onAtualizado: () => void
}) {
  const [loading, setLoading] = useState<'aprovar' | 'rejeitar' | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  async function agir(acao: 'aprovar' | 'rejeitar') {
    setLoading(acao)
    setAviso(null)
    try {
      const res = await fetch('/api/admin/pedidos/cancelar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: order.payment_id, acao }),
      })
      const data = await res.json()
      if (!res.ok) {
        setAviso(data.error ?? 'Erro.')
      } else {
        if (data.aviso) setAviso(`Cancelado. Aviso reembolso: ${data.aviso}`)
        onAtualizado()
      }
    } catch {
      setAviso('Erro de conexão.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="mt-4 border border-orange-300 bg-orange-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-orange-800 mb-1">
        ⚠ Solicitação de cancelamento
      </p>
      {order.cancelamento_data && (
        <p className="text-xs text-orange-700 mb-1">
          Solicitado em:{' '}
          {new Date(order.cancelamento_data).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })}
        </p>
      )}
      {order.cancelamento_motivo && (
        <p className="text-sm text-orange-900 mb-3 italic">
          &ldquo;{order.cancelamento_motivo}&rdquo;
        </p>
      )}
      {aviso && <p className="mb-2 text-xs text-red-700">{aviso}</p>}
      <div className="flex gap-3">
        <button
          type="button"
          disabled={!!loading}
          onClick={() => agir('aprovar')}
          className="flex items-center gap-1.5 bg-red-600 px-4 py-2 text-xs uppercase tracking-widest text-white hover:bg-red-700 disabled:opacity-60"
        >
          {loading === 'aprovar' && <Loader2 className="h-3 w-3 animate-spin" />}
          Aprovar e reembolsar
        </button>
        <button
          type="button"
          disabled={!!loading}
          onClick={() => agir('rejeitar')}
          className="flex items-center gap-1.5 border border-border px-4 py-2 text-xs uppercase tracking-widest text-foreground hover:bg-accent disabled:opacity-60"
        >
          {loading === 'rejeitar' && <Loader2 className="h-3 w-3 animate-spin" />}
          Rejeitar
        </button>
      </div>
    </div>
  )
}

export default function AdminPedidosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<'todos' | 'cancelamentos'>('todos')

  function carregarPedidos() {
    fetch('/api/admin/pedidos')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { router.push('/'); return }
        setOrders(d.orders ?? [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin/pedidos')
      return
    }
    if (status === 'authenticated') {
      carregarPedidos()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, router])

  const cancelamentosPendentes = orders.filter((o) => o.cancelamento_solicitado && o.status_envio !== 'cancelado').length

  const pedidosFiltrados = orders.filter((o) => {
    if (filtro === 'cancelamentos') return o.cancelamento_solicitado && o.status_envio !== 'cancelado'
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
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl text-foreground">Painel de Pedidos</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {orders.length} pedido{orders.length !== 1 ? 's' : ''} · Total: {formatPrice(totalGeral)}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setFiltro('todos'); setBusca('') }}
                className={`px-3 py-1.5 text-xs uppercase tracking-widest border ${filtro === 'todos' ? 'bg-foreground text-background border-foreground' : 'border-border text-muted-foreground hover:border-foreground'}`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => { setFiltro('cancelamentos'); setBusca('') }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-widest border ${filtro === 'cancelamentos' ? 'bg-orange-600 text-white border-orange-600' : 'border-orange-300 text-orange-700 hover:bg-orange-50'}`}
              >
                Cancelamentos
                {cancelamentosPendentes > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-[10px] text-white font-bold" style={filtro === 'cancelamentos' ? { background: 'white', color: '#c2410c' } : {}}>
                    {cancelamentosPendentes}
                  </span>
                )}
              </button>
            </div>
            {filtro === 'todos' && (
              <input
                type="text"
                placeholder="Buscar por email, ID ou rastreio..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="border border-border bg-background px-4 py-2 text-sm focus:border-gold focus:outline-none sm:w-64"
              />
            )}
          </div>
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
                <div
                  key={order.id}
                  className={`border bg-background p-5 ${order.cancelamento_solicitado && order.status_envio !== 'cancelado' ? 'border-orange-300' : 'border-border'}`}
                >
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
                      {order.aceito && (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                          Aceito ✓
                        </span>
                      )}
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

                  {/* aceitar / negar pedido pago */}
                  {order.status === 'approved' && !order.aceito && order.status_envio !== 'cancelado' && !order.cancelamento_solicitado && (
                    <BotoesAceite order={order} onAtualizado={carregarPedidos} />
                  )}

                  {/* cancelamento pendente */}
                  {order.cancelamento_solicitado && order.status_envio !== 'cancelado' && (
                    <BotoesReembolso order={order} onAtualizado={carregarPedidos} />
                  )}
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
