/**
 * Pedido de TESTE (somente admin): cria um pagamento de valor simbólico,
 * sem frete (retirada), usando o mesmo fluxo do checkout real
 * (pedido pending + webhook + painel admin + reembolso).
 */
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/admin-emails'
import { mpAccessToken } from '@/lib/mp'
import { rateLimit, getIp } from '@/lib/rate-limit'
import { logAdmin } from '@/lib/audit'
import sql from '@/lib/db'

const client = new MercadoPagoConfig({ accessToken: mpAccessToken() })
const VALORES_PERMITIDOS = [0.1, 1, 5]

export async function POST(req: NextRequest) {
  const ip = getIp(req)
  const { allowed } = await rateLimit(ip, { maxRequests: 5, windowMs: 10 * 60_000 })
  if (!allowed) return NextResponse.json({ error: 'Muitas tentativas.' }, { status: 429 })

  const session = await auth()
  const email = session?.user?.email?.toLowerCase()
  if (!email || !isAdmin(email)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const valor = Number(body?.valor)
  if (!VALORES_PERMITIDOS.includes(valor)) {
    return NextResponse.json({ error: 'Valor não permitido.' }, { status: 400 })
  }

  try {
    await Promise.all([
      sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS dados_envio jsonb`,
      sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS preference_id text`,
      sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_ref text`,
    ])

    const orderRef = randomUUID()
    const appUrl = process.env.APP_URL || 'http://localhost:3000'
    const items = [{
      id: 'teste-pagamento',
      title: 'Pedido de TESTE - Belice Modas',
      description: 'Teste de pagamento (retirada, sem frete)',
      quantity: 1,
      unit_price: valor,
      currency_id: 'BRL',
    }]

    const result = await new Preference(client).create({
      body: {
        items,
        payer: { email },
        external_reference: JSON.stringify({ email, pedido: orderRef, teste: true }),
        back_urls: {
          success: `${appUrl}/pedido/confirmacao?status=approved`,
          failure: `${appUrl}/pedido/confirmacao?status=failure`,
          pending: `${appUrl}/pedido/confirmacao?status=pending`,
        },
        auto_return: 'approved',
        payment_methods: { installments: 1 },
        statement_descriptor: 'BELICE MODAS',
        notification_url: `${appUrl}/api/webhook/mercadopago`,
      },
    })

    if (!result.id || !result.init_point) {
      return NextResponse.json({ error: 'Mercado Pago não retornou o link de pagamento.' }, { status: 502 })
    }

    await sql`
      INSERT INTO orders (payment_id, payment_type, status, payer_email, endereco, total, items, preference_id, order_ref)
      VALUES (
        ${'pref_' + result.id}, 'preference', 'pending', ${email},
        'TESTE - Retirada na loja', ${valor}, ${JSON.stringify(items)},
        ${String(result.id)}, ${orderRef}
      )
      ON CONFLICT (payment_id) DO NOTHING
    `
    await logAdmin({ adminEmail: email, acao: 'pedido_teste_criado', paymentId: 'pref_' + result.id, ip, detalhes: { valor } })

    return NextResponse.json({ init_point: result.init_point })
  } catch (err: any) {
    console.error('Erro ao criar pedido de teste:', err)
    const msg = typeof err?.message === 'string' ? err.message.slice(0, 200) : 'Erro ao criar pagamento de teste.'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
