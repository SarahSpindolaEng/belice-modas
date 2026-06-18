import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import sql from '@/lib/db'
import { rateLimit, getIp } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  const { allowed } = await rateLimit(getIp(req), { maxRequests: 60, windowMs: 60_000 })
  if (!allowed) return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 })

  const session = await auth()

  if (!session?.user?.email) {
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
      total,
      items,
      created_at
    FROM orders
    WHERE payer_email = ${session.user.email}
    ORDER BY created_at DESC
  `

  return NextResponse.json({ orders })
}
