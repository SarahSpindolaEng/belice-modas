import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import sql from '@/lib/db'
import { rateLimit, getIp } from '@/lib/rate-limit'
import { isAdmin } from '@/lib/admin-emails'
import { gerarEtiqueta } from '@/lib/melhor-envio-etiqueta'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

// Garante colunas auxiliares (migração lazy, idempotente).
let schemaReady: Promise<unknown> | null = null
function ensureSchema() {
  if (!schemaReady) {
    schemaReady = Promise.all([
      sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS aceito boolean NOT NULL DEFAULT false`,
      sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS dados_envio jsonb`,
      sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS preference_id text`,
      sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS label_url text`,
      sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS label_erro text`,
    ])
  }
  return schemaReady
}

/**
 * Aceitar ou negar um pedido PAGO.
 * - aceitar: gera a etiqueta no Melhor Envio e libera o pedido.
 *   (se a etiqueta falhar, o pedido ainda é aceito; o admin gera manualmente.)
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
    SELECT id, payment_id, status, status_envio, aceito, total, items, dados_envio
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

    // Gera a etiqueta no Melhor Envio
    const etiqueta = await gerarEtiqueta({
      total: order.total,
      items: order.items,
      dados_envio: order.dados_envio,
    })

    if (etiqueta.ok) {
      await sql`
        UPDATE orders SET
          aceito = true,
          status_envio = 'etiqueta_gerada',
          tracking_code = COALESCE(${etiqueta.tracking ?? null}, tracking_code),
          melhor_envio_id = COALESCE(${etiqueta.melhorEnvioId ?? null}, melhor_envio_id),
          label_url = ${etiqueta.labelUrl ?? null},
          label_erro = NULL
        WHERE payment_id = ${payment_id}
      `
      return NextResponse.json({
        ok: true,
        mensagem: 'Pedido aceito e etiqueta gerada.',
        labelUrl: etiqueta.labelUrl ?? null,
        aviso: etiqueta.erro ?? null,
      })
    }

    // Etiqueta falhou — NAO marca como aceito; mostra o erro pro admin corrigir e tentar de novo.
    await sql`UPDATE orders SET label_erro = ${etiqueta.erro ?? 'erro desconhecido'} WHERE payment_id = ${payment_id}`
    return NextResponse.json(
      { error: `Não foi possível gerar a etiqueta: ${etiqueta.erro}` },
      { status: 502 },
    )
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
