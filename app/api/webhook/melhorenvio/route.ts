import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import sql from '@/lib/db'

// Comparacao em tempo constante (evita timing attack na checagem do secret)
function secretsIguais(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

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
    if (process.env.NODE_ENV === 'production') {
      console.error('MELHOR_ENVIO_WEBHOOK_SECRET ausente em producao — webhook recusado. Configure a variavel no Vercel.')
      return false
    }
    console.warn('MELHOR_ENVIO_WEBHOOK_SECRET nao configurado (dev) — aceitando sem validar.')
    return true
  }
  // Prefere o header (nao para em logs de acesso como a query string).
  const headerSecret =
    req.headers.get('x-webhook-secret') ??
    req.nextUrl.searchParams.get('secret')
  if (!headerSecret) return false
  return secretsIguais(headerSecret, secret)
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
