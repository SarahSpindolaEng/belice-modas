import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import sql from '@/lib/db'
import { rateLimit, getIp } from '@/lib/rate-limit'
import { isAdmin } from '@/lib/admin-emails'

export async function GET(req: NextRequest) {
  const { allowed } = await rateLimit(getIp(req), { maxRequests: 30, windowMs: 60_000 })
  if (!allowed) return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 })

  const session = await auth()

  if (!isAdmin(session?.user?.email)) {
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
    WHERE status <> 'pending'
    ORDER BY
      cancelamento_solicitado DESC,
      created_at DESC
    LIMIT 500
  `

  return NextResponse.json({ orders })
}
