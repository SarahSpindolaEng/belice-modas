import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

// Status do Melhor Envio → status amigável
const STATUS_MAP: Record<string, string> = {
  pending:     'aguardando_envio',
  released:    'etiqueta_gerada',
  posted:      'postado',
  delivered:   'entregue',
  undelivered: 'tentativa_entrega',
  canceled:    'cancelado',
}

function verificarSecreta(req: NextRequest): boolean {
  const secret = process.env.MELHOR_ENVIO_WEBHOOK_SECRET
  if (!secret) {
    console.warn('MELHOR_ENVIO_WEBHOOK_SECRET não configurado — webhook sem proteção!')
    return true
  }
  const headerSecret =
    req.headers.get('x-webhook-secret') ??
    req.nextUrl.searchParams.get('secret')
  return headerSecret === secret
}

export async function POST(req: NextRequest) {
  if (!verificarSecreta(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const events = Array.isArray(body) ? body : [body]

    for (const event of events) {
      const melhorEnvioId = event.id ?? event.order_id
      const tracking = event.tracking ?? event.tracking_code ?? null
      const rawStatus = event.status ?? event.status_id ?? null
      const statusEnvio = STATUS_MAP[rawStatus] ?? rawStatus ?? 'aguardando_envio'

      if (!melhorEnvioId) continue

      await sql`
        UPDATE orders
        SET
          status_envio    = ${statusEnvio},
          tracking_code   = COALESCE(${tracking}, tracking_code),
          melhor_envio_id = COALESCE(melhor_envio_id, ${String(melhorEnvioId)})
        WHERE melhor_envio_id = ${String(melhorEnvioId)}
           OR payment_id      = ${String(melhorEnvioId)}
      `
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook Melhor Envio erro:', err)
    return NextResponse.json({ ok: true })
  }
}
