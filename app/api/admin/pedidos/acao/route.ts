import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import sql from '@/lib/db'
import { rateLimit, getIp } from '@/lib/rate-limit'
import { isAdmin } from '@/lib/admin-emails'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

// Garante a coluna `aceito` (migração lazy, idempotente).
let schemaReady: Promise<unknown> | null = null
function ensureSchema() {
  if (!schemaReady) {
    schemaReady = sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS aceito boolean NOT NULL DEFAULT false`
  }
  return schemaReady
}

/**
 * Aceitar ou negar um pedido PAGO.
 * - aceitar: libera o pedido (marca aceito = true). A etiqueta sera gerada nesta etapa (fase 2).
 * - negar: reembolsa o cliente no Mercado Pago e cancela o pedido.
 */
export async function POST(req: NextRequest) {
  const { allowed } = await rateLimit(getIp(req), { maxRequests: 20, windowMs: 60_000 })
  if (!allowed) return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 })

  const session = await auth()
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  await ensureSchema()

  const { payment_id, acao } = await req.json() // acao: 'aceitar' | 'negar'
  if (!payment_id || !['aceitar', 'negar'].includes(acao)) {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
  }

  const [order] = await sql`
    SELECT id, payment_id, status, status_envio, aceito
    FROM orders
    WHERE payment_id = ${payment_id}
  `

  if (!order) {
    return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 })
  }
  if (order.status !== 'approved') {
    return NextResponse.json({ error: 'Pedido não está pago.' }, { status: 400 })
  }

  if (acao === 'aceitar') {
    if (order.aceito) {
      return NextResponse.json({ error: 'Pedido já foi aceito.' }, { status: 400 })
    }
    await sql`
      UPDATE orders SET aceito = true, status_envio = 'aguardando_envio'
      WHERE payment_id = ${payment_id}
    `
    // FASE 2: aqui entrara a geracao da etiqueta no Melhor Envio.
    return NextResponse.json({ ok: true, mensagem: 'Pedido aceito.' })
  }

  // acao === 'negar' → reembolso + cancelamento
  let reembolsoOk = false
  let erroReembolso: string | null = null
  try {
    const payment = new Payment(client)
    const mpId = order.payment_id.replace(/^pref_/, '')
    if (/^\d+$/.test(mpId)) {
      await payment.refund({ id: Number(mpId), body: {} })
      reembolsoOk = true
    } else {
      erroReembolso = 'ID de pagamento inválido para reembolso (modo teste).'
    }
  } catch (err: any) {
    erroReembolso = err?.message ?? 'Erro ao processar reembolso.'
    console.error('Erro reembolso MP (negar):', err)
  }

  await sql`
    UPDATE orders SET status = 'cancelled', status_envio = 'cancelado'
    WHERE payment_id = ${payment_id}
  `

  return NextResponse.json({ ok: true, reembolso: reembolsoOk, aviso: erroReembolso })
}
