import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import sql from '@/lib/db'
import { rateLimit, getIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  // Máx 5 solicitações de cancelamento por 10 min por IP
  const { allowed } = rateLimit(getIp(req), { maxRequests: 5, windowMs: 10 * 60_000 })
  if (!allowed) return NextResponse.json({ error: 'Muitas tentativas.' }, { status: 429 })
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const payment_id = typeof body.payment_id === 'string' ? body.payment_id.trim().slice(0, 200) : ''
  // Sanitiza motivo — sem HTML, máx 1000 chars
  const motivo = typeof body.motivo === 'string'
    ? body.motivo.replace(/[<>]/g, '').trim().slice(0, 1000)
    : 'Não informado'

  if (!payment_id) {
    return NextResponse.json({ error: 'Pedido não informado.' }, { status: 400 })
  }

  // Verifica se o pedido pertence ao cliente e está em status cancelável
  const [order] = await sql`
    SELECT id, status, status_envio, cancelamento_solicitado
    FROM orders
    WHERE payment_id = ${payment_id}
      AND payer_email = ${session.user.email}
  `

  if (!order) {
    return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 })
  }

  if (order.cancelamento_solicitado) {
    return NextResponse.json({ error: 'Cancelamento já solicitado.' }, { status: 400 })
  }

  if (!['aguardando_envio', 'etiqueta_gerada'].includes(order.status_envio)) {
    return NextResponse.json(
      { error: 'Pedido já foi enviado e não pode ser cancelado.' },
      { status: 400 },
    )
  }

  await sql`
    UPDATE orders SET
      cancelamento_solicitado = TRUE,
      cancelamento_motivo = ${motivo ?? 'Não informado'},
      cancelamento_data = NOW()
    WHERE payment_id = ${payment_id}
      AND payer_email = ${session.user.email}
  `

  return NextResponse.json({ ok: true })
}
