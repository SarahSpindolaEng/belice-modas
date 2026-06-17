'use client'

/**
 * Sino de notificações em tempo real para admins.
 * Conecta ao SSE /api/admin/notificacoes e acumula eventos.
 * Renderiza um sino com badge de contagem no header.
 */

import { useEffect, useRef, useState } from 'react'
import { Bell, X, ShoppingBag, XCircle } from 'lucide-react'
import { formatPrice } from '@/lib/products'

interface Notificacao {
  id: string
  tipo: 'novo_pedido' | 'cancelamento_solicitado'
  email: string
  total: number
  motivo?: string
  ts: string
  lida: boolean
}

export function AdminNotificacoes() {
  const [notifs, setNotifs] = useState<Notificacao[]>([])
  const [open, setOpen] = useState(false)
  const esRef = useRef<EventSource | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const naoLidas = notifs.filter((n) => !n.lida).length

  function conectar() {
    if (esRef.current) esRef.current.close()

    const es = new EventSource('/api/admin/notificacoes')
    esRef.current = es

    function addNotif(tipo: Notificacao['tipo'], data: Omit<Notificacao, 'id' | 'tipo' | 'lida'>) {
      const notif: Notificacao = {
        id: `${tipo}-${data.ts}-${Math.random()}`,
        tipo,
        lida: false,
        ...data,
      }
      setNotifs((prev) => {
        // Evita duplicatas por ts + email
        const existe = prev.some((n) => n.tipo === tipo && n.ts === data.ts && n.email === data.email)
        if (existe) return prev
        return [notif, ...prev].slice(0, 50)
      })
    }

    es.addEventListener('novo_pedido', (e) => {
      const d = JSON.parse(e.data)
      addNotif('novo_pedido', { email: d.email, total: d.total, ts: d.ts })
      // Notificação do browser se permitido
      if (Notification.permission === 'granted') {
        new Notification('Belice Modas — Novo pedido 🛍️', {
          body: `${d.email} · ${formatPrice(d.total)}`,
          icon: '/logo-belice-symbol.png',
        })
      }
    })

    es.addEventListener('cancelamento_solicitado', (e) => {
      const d = JSON.parse(e.data)
      addNotif('cancelamento_solicitado', { email: d.email, total: d.total, motivo: d.motivo, ts: d.ts })
      if (Notification.permission === 'granted') {
        new Notification('Belice Modas — Cancelamento solicitado ⚠️', {
          body: `${d.email} · ${formatPrice(d.total)}`,
          icon: '/logo-belice-symbol.png',
        })
      }
    })

    es.addEventListener('reconectar', () => {
      es.close()
      setTimeout(conectar, 2_000)
    })

    es.onerror = () => {
      es.close()
      setTimeout(conectar, 10_000)
    }
  }

  useEffect(() => {
    conectar()
    // Pede permissão para notificações do browser
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    return () => esRef.current?.close()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function marcarTodasLidas() {
    setNotifs((prev) => prev.map((n) => ({ ...n, lida: true })))
  }

  function remover(id: string) {
    setNotifs((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v)
          if (!open) marcarTodasLidas()
        }}
        className="relative text-foreground hover:text-gold-dark transition-colors"
        aria-label="Notificações admin"
      >
        <Bell className="h-5 w-5" />
        {naoLidas > 0 && (
          <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 border border-border bg-background shadow-xl z-50 max-h-[420px] flex flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-foreground">
              Notificações
            </p>
            <div className="flex items-center gap-3">
              {notifs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setNotifs([])}
                  className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-red-600 transition-colors"
                >
                  Limpar
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)}>
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {notifs.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Nenhuma notificação
              </div>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 border-b border-border px-4 py-3 hover:bg-accent/30 transition-colors"
                >
                  <div className="mt-0.5 shrink-0">
                    {n.tipo === 'novo_pedido' ? (
                      <ShoppingBag className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-orange-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">
                      {n.tipo === 'novo_pedido' ? 'Novo pedido' : 'Cancelamento solicitado'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{n.email}</p>
                    <p className="text-xs font-medium text-foreground">{formatPrice(n.total)}</p>
                    {n.motivo && (
                      <p className="text-xs italic text-muted-foreground truncate">&ldquo;{n.motivo}&rdquo;</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(n.ts).toLocaleString('pt-BR', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <button type="button" onClick={() => remover(n.id)}>
                    <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
