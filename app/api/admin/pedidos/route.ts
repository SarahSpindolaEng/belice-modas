import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import sql from '@/lib/db'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase())

export async function GET() {
  const session = await auth()

  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const orders = await sql`
    SELECT
      id,
      payment_id,
      payment_type,
      status,
      status_envio,
      tracking_code,
      payer_email,
      endereco,
      total,
      items,
      created_at,
      cancelamento_solicitado,
      cancelamento_motivo,
      cancelamento_data
    FROM orders
    ORDER BY
      cancelamento_solicitado DESC,
      created_at DESC
    LIMIT 500
  `

  return NextResponse.json({ orders })
}
