import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

// Status do Melhor Envio → status amigável
const STATUS_MAP: Record<string, string> = {
  pending:    'aguardando_envio',
  released:   'etiqueta_gerada',
  posted:     'postado',
  delivered:  'entregue',
  undelivered:'tentativa_entrega',
  canceled:   'cancelado',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Melhor Envio envia array de tracking events
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
          status_envio  = ${statusEnvio},
          tracking_code = COALESCE(${tracking}, tracking_code),
          melhor_envio_id = COALESCE(melhor_envio_id, ${String(melhorEnvioId)})
        WHERE melhor_envio_id = ${String(melhorEnvioId)}
           OR payment_id = ${String(melhorEnvioId)}
      `
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook Melhor Envio erro:', err)
    return NextResponse.json({ ok: true })
  }
}
