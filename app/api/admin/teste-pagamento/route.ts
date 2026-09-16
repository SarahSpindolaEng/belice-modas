/**
 * Pagamento de TESTE (somente admin) pela API do Mercado Pago (Checkout Transparente).
 * O formulário de cartão (Card Payment Brick) gera um token no navegador;
 * aqui o servidor cria o pagamento. Valor e descrição são definidos no servidor.
 * Segue o mesmo fluxo do checkout real: pedido pending + webhook + painel + reembolso.
 */
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/admin-emails'
import { mpAccessToken } from '@/lib/mp'
import { rateLimit, getIp } from '@/lib/rate-limit'
import { logAdmin } from '@/lib/audit'
import sql from '@/lib/db'

const client = new MercadoPagoConfig({ accessToken: mpAccessToken() })
const VALORES_TESTE = [0.1, 1, 5]

export async function POST(req: NextRequest) {
  const ip = getIp(req)
  const { allowed } = await rateLimit(ip, { maxRequests: 5, windowMs: 10 * 60_000 })
  if (!allowed) return NextResponse.json({ error: 'Muitas tentativas.' }, { status: 429 })

  const session = await auth()
  const adminEmail = session?.user?.email?.toLowerCase()
  if (!adminEmail || !isAdmin(adminEmail)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const valor = Number(body?.valor)
  const fd = body?.formData
  if (!VALORES_TESTE.includes(valor)) {
    return NextResponse.json({ error: 'Valor não permitido.' }, { status: 400 })
  }
  if (!fd || typeof fd.token !== 'string' || typeof fd.payment_method_id !== 'string') {
    return NextResponse.json({ error: 'Dados do cartão ausentes.' }, { status: 400 })
  }

  const payerEmailRaw = typeof fd.payer?.email === 'string' ? fd.payer.email.trim().toLowerCase().slice(0, 254) : ''
  const payerEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payerEmailRaw) ? payerEmailRaw : adminEmail
  const docType = typeof fd.payer?.identification?.type === 'string' ? fd.payer.identification.type.slice(0, 10) : undefined
  const docNumber = typeof fd.payer?.identification?.number === 'string' ? fd.payer.identification.number.replace(/\D/g, '').slice(0, 14) : undefined

  try {
    await Promise.all([
      sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS preference_id text`,
      sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_ref text`,
    ])

    const orderRef = randomUUID()
    const appUrl = process.env.APP_URL || 'http://localhost:3000'
    const items = [{
      id: 'teste-pagamento',
      title: 'Pedido de TESTE - Belice Modas',
      quantity: 1,
      unit_price: valor,
      currency_id: 'BRL',
    }]

    // Pedido pending (o webhook promove para approved pelo order_ref)
    await sql`
      INSERT INTO orders (payment_id, payment_type, status, payer_email, endereco, total, items, order_ref)
      VALUES (
        ${'tst_' + orderRef}, 'api', 'pending', ${adminEmail},
        'TESTE - Retirada na loja', ${valor}, ${JSON.stringify(items)}, ${orderRef}
      )
    `

    const pagamento = await new Payment(client).create({
      body: {
        transaction_amount: valor,
        token: fd.token,
        description: 'Pedido de TESTE - Belice Modas',
        installments: 1,
        payment_method_id: fd.payment_method_id,
        issuer_id: fd.issuer_id ? Number(fd.issuer_id) : undefined,
        payer: {
          email: payerEmail,
          identification: docType && docNumber ? { type: docType, number: docNumber } : undefined,
        },
        external_reference: JSON.stringify({ email: adminEmail, pedido: orderRef, teste: true }),
        notification_url: `${appUrl}/api/webhook/mercadopago`,
        statement_descriptor: 'BELICE MODAS',
        additional_info: { items: items.map(({ currency_id, ...i }) => i) },
      },
      requestOptions: { idempotencyKey: orderRef },
    })

    await logAdmin({
      adminEmail, acao: 'pagamento_teste', paymentId: String(pagamento.id ?? ''), ip,
      detalhes: { valor, status: pagamento.status, status_detail: pagamento.status_detail },
    })

    return NextResponse.json({
      id: pagamento.id,
      status: pagamento.status,
      status_detail: pagamento.status_detail,
    })
  } catch (err: any) {
    console.error('Erro no pagamento de teste:', err)
    const msg = typeof err?.message === 'string' ? err.message.slice(0, 200) : 'Erro ao processar pagamento de teste.'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
