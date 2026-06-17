/**
 * SSE (Server-Sent Events) — admin recebe notificações em tempo real
 * sem precisar recarregar a página.
 *
 * O endpoint faz polling no banco a cada 8 s e emite eventos quando
 * detecta novos pedidos ou cancelamentos desde a última verificação.
 *
 * Compatível com Vercel (streaming com Edge Runtime opcional, mas
 * funciona também com Node runtime — Edge usa ReadableStream nativo).
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import sql from '@/lib/db'
import { rateLimit, getIp } from '@/lib/rate-limit'
import { isAdmin } from '@/lib/admin-emails'

export const dynamic = 'force-dynamic'

const POLL_INTERVAL_MS = 8_000 // verifica banco a cada 8 s
const MAX_DURATION_MS = 55_000 // encerra antes do timeout Vercel (60 s)

export async function GET(req: NextRequest) {
  // Máx 10 reconexões por minuto por IP (SSE reconecta automaticamente)
  const { allowed } = rateLimit(getIp(req), { maxRequests: 10, windowMs: 60_000 })
  if (!allowed) return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 })

  const session = await auth()
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()

      function send(event: string, data: unknown) {
        controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      // Envia ping inicial para confirmar conexão
      send('ping', { ok: true, ts: Date.now() })

      const startedAt = Date.now()
      let lastCheck = new Date(Date.now() - POLL_INTERVAL_MS).toISOString()

      while (Date.now() - startedAt < MAX_DURATION_MS) {
        await sleep(POLL_INTERVAL_MS)

        try {
          // Novos pedidos aprovados desde lastCheck
          const novosPedidos = await sql`
            SELECT id, payer_email, total, created_at
            FROM orders
            WHERE created_at > ${lastCheck}
              AND status = 'approved'
            ORDER BY created_at ASC
          `

          for (const p of novosPedidos) {
            send('novo_pedido', {
              id: p.id,
              email: p.payer_email,
              total: p.total,
              ts: p.created_at,
            })
          }

          // Novas solicitações de cancelamento desde lastCheck
          const cancelamentos = await sql`
            SELECT id, payer_email, total, cancelamento_data, cancelamento_motivo
            FROM orders
            WHERE cancelamento_data > ${lastCheck}
              AND cancelamento_solicitado = TRUE
            ORDER BY cancelamento_data ASC
          `

          for (const c of cancelamentos) {
            send('cancelamento_solicitado', {
              id: c.id,
              email: c.payer_email,
              total: c.total,
              motivo: c.cancelamento_motivo,
              ts: c.cancelamento_data,
            })
          }

          lastCheck = new Date().toISOString()
        } catch {
          // Erro silencioso — não encerra o stream por falha de DB
          send('ping', { ok: false, ts: Date.now() })
        }
      }

      // Sinaliza ao cliente para reconectar
      send('reconectar', { ts: Date.now() })
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
