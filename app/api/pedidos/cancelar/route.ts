import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import sql from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { payment_id, motivo } = await req.json()

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
