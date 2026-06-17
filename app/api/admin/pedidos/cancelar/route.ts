import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import sql from '@/lib/db'
import { rateLimit, getIp } from '@/lib/rate-limit'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase())

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

export async function POST(req: NextRequest) {
  // Rate limit: máx 10 ações de cancelamento por minuto por IP
  const { allowed } = rateLimit(getIp(req), { maxRequests: 10, windowMs: 60_000 })
  if (!allowed) return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 })

  const session = await auth()
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { payment_id, acao } = await req.json() // acao: 'aprovar' | 'rejeitar'

  if (!payment_id || !['aprovar', 'rejeitar'].includes(acao)) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  const [order] = await sql`
    SELECT id, payment_id, status, cancelamento_solicitado
    FROM orders
    WHERE payment_id = ${payment_id}
  `

  if (!order) {
    return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 })
  }

  if (!order.cancelamento_solicitado) {
    return NextResponse.json({ error: 'Nenhuma solicitação de cancelamento.' }, { status: 400 })
  }

  if (acao === 'rejeitar') {
    await sql`
      UPDATE orders SET
        cancelamento_solicitado = FALSE,
        cancelamento_motivo = NULL,
        cancelamento_data = NULL
      WHERE payment_id = ${payment_id}
    `
    return NextResponse.json({ ok: true, mensagem: 'Cancelamento rejeitado.' })
  }

  // Aprovar: tenta reembolso no MP
  let reembolsoOk = false
  let erroReembolso = null

  try {
    const payment = new Payment(client)
    // O payment_id real começa com número, não com 'pref_' ou 'TEST-'
    const mpId = order.payment_id.replace(/^pref_/, '')
    if (/^\d+$/.test(mpId)) {
      await payment.refund({ id: Number(mpId), body: {} })
      reembolsoOk = true
    } else {
      erroReembolso = 'ID de pagamento inválido para reembolso (modo teste).'
    }
  } catch (err: any) {
    erroReembolso = err?.message ?? 'Erro ao processar reembolso.'
    console.error('Erro reembolso MP:', err)
  }

  // Marca como cancelado independente do reembolso
  await sql`
    UPDATE orders SET
      status = 'cancelled',
      status_envio = 'cancelado'
    WHERE payment_id = ${payment_id}
  `

  return NextResponse.json({
    ok: true,
    reembolso: reembolsoOk,
    aviso: erroReembolso,
  })
}
