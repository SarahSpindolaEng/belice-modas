import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { products } from '@/lib/products'
import { rateLimit, getIp } from '@/lib/rate-limit'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

export async function POST(req: NextRequest) {
  // Rate limit: máx 10 checkouts por IP a cada 10 minutos
  const { allowed } = rateLimit(getIp(req), { maxRequests: 10, windowMs: 10 * 60 * 1000 })
  if (!allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde alguns minutos.' },
      { status: 429 },
    )
  }

  try {
    const { items, email } = await req.json()

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Carrinho vazio.' }, { status: 400 })
    }

    if (items.length > 50) {
      return NextResponse.json({ error: 'Carrinho inválido.' }, { status: 400 })
    }

    // ✅ Validar cada item contra o catálogo real — ignora preço do cliente
    const validatedItems = []
    for (const item of items) {
      const product = products.find((p) => p.id === item.id)

      if (!product) {
        return NextResponse.json(
          { error: `Produto não encontrado: ${item.id}` },
          { status: 400 },
        )
      }

      if (product.price <= 0 || product.pendingPrice) {
        return NextResponse.json(
          { error: `Produto indisponível para compra: ${product.name}` },
          { status: 400 },
        )
      }

      const quantity = Math.max(1, Math.min(99, Number(item.quantity) || 1))

      validatedItems.push({
        id: product.id,
        title: product.name,
        quantity,
        unit_price: product.price,   // ← preço REAL do servidor, nunca do cliente
        currency_id: 'BRL',
        description: item.color
          ? item.color + (item.size ? ' - ' + item.size : '')
          : item.size ?? '',
        picture_url: product.images[0] ?? undefined,
      })
    }

    const preference = new Preference(client)
    const appUrl = process.env.APP_URL || 'http://localhost:3000'

    const result = await preference.create({
      body: {
        items: validatedItems,
        payer: email ? { email } : undefined,
        back_urls: {
          success: `${appUrl}/pedido/confirmacao?status=approved`,
          failure: `${appUrl}/pedido/confirmacao?status=failure`,
          pending: `${appUrl}/pedido/confirmacao?status=pending`,
        },
        auto_return: 'approved',
        statement_descriptor: 'BELICE MODAS',
        notification_url: `${appUrl}/api/webhook/mercadopago`,
      },
    })

    return NextResponse.json({ init_point: result.init_point, id: result.id })
  } catch (err) {
    console.error('Erro ao criar preferência MP:', err)
    return NextResponse.json({ error: 'Erro ao iniciar pagamento.' }, { status: 500 })
  }
}
