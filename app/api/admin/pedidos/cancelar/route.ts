import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { mpAccessToken } from '@/lib/mp'
import { MercadoPagoConfig, PaymentRefund } from 'mercadopago'
import sql from '@/lib/db'
import { rateLimit, getIp } from '@/lib/rate-limit'
import { isAdmin } from '@/lib/admin-emails'
import { logAdmin } from '@/lib/audit'

const client = new MercadoPagoConfig({
  accessToken: mpAccessToken(),
})

export async function POST(req: NextRequest) {
  // Rate limit: máx 10 ações de cancelamento por minuto por IP
  const ip = getIp(req)
  const { allowed } = await rateLimit(ip, { maxRequests: 10, windowMs: 60_000 })
  if (!allowed) return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 })

  const session = await auth()
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const adminEmail = session!.user!.email!
  const body = await req.json().catch(() => null)
  const payment_id = typeof body?.payment_id === 'string' ? body.payment_id.slice(0, 200) : ''
  const acao = body?.acao // 'aprovar' | 'rejeitar'

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
    await logAdmin({ adminEmail, acao: 'cancelamento_rejeitado', paymentId: payment_id, ip })
    return NextResponse.json({ ok: true, mensagem: 'Cancelamento rejeitado.' })
  }

  // Aprovar: tenta reembolso no MP
  let reembolsoOk = false
  let erroReembolso = null

  try {
    const refund = new PaymentRefund(client)
    // O payment_id real começa com número, não com 'pref_' ou 'TEST-'
    const mpId = order.payment_id.replace(/^pref_/, '')
    if (/^\d+$/.test(mpId)) {
      await refund.total({ payment_id: mpId })
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

  await logAdmin({ adminEmail, acao: 'cancelamento_aprovado', paymentId: payment_id, ip, detalhes: { reembolso: reembolsoOk, erro: erroReembolso } })
  return NextResponse.json({
    ok: true,
    reembolso: reembolsoOk,
    aviso: erroReembolso,
  })
}
