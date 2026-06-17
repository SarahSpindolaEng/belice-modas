import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { products } from '@/lib/products'
import { rateLimit, getIp } from '@/lib/rate-limit'
import sql from '@/lib/db'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

export async function POST(req: NextRequest) {
  const { allowed } = rateLimit(getIp(req), { maxRequests: 10, windowMs: 10 * 60 * 1000 })
  if (!allowed) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde alguns minutos.' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const items = body.items
    // Sanitiza e valida email
    const emailRaw = typeof body.email === 'string' ? body.email.trim().slice(0, 254) : ''
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)
    const email = emailValido ? emailRaw : null
    // Sanitiza endereço — máx 500 chars, sem HTML
    const endereco = typeof body.endereco === 'string'
      ? body.endereco.replace(/[<>]/g, '').trim().slice(0, 500)
      : null

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Carrinho vazio.' }, { status: 400 })
    }
    if (items.length > 50) {
      return NextResponse.json({ error: 'Carrinho inválido.' }, { status: 400 })
    }

    // Validar itens contra catálogo real
    const validatedItems = []
    for (const item of items) {
      const product = products.find((p) => p.id === item.id)
      if (!product) return NextResponse.json({ error: `Produto não encontrado: ${item.id}` }, { status: 400 })
      if (product.price <= 0 || product.pendingPrice) return NextResponse.json({ error: `Produto indisponível: ${product.name}` }, { status: 400 })
      const quantity = Math.max(1, Math.min(99, Number(item.quantity) || 1))
      validatedItems.push({
        id: product.id,
        title: product.name,
        quantity,
        unit_price: product.price,
        currency_id: 'BRL',
        description: item.color ? item.color + (item.size ? ' - ' + item.size : '') : item.size ?? '',
        picture_url: product.images[0] ?? undefined,
      })
    }

    const preference = new Preference(client)
    const appUrl = process.env.APP_URL || 'http://localhost:3000'
    const total = validatedItems.reduce((s, i) => s + i.unit_price * i.quantity, 0)

    const result = await preference.create({
      body: {
        items: validatedItems,
        payer: email ? { email } : undefined,
        external_reference: JSON.stringify({ email: email ?? null, endereco: endereco ?? null }),
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

    // Salva pedido como pending com endereço para o webhook atualizar depois
    if (result.id) {
      await sql`
        INSERT INTO orders (payment_id, payment_type, status, payer_email, endereco, total, items)
        VALUES (
          ${'pref_' + result.id},
          'preference',
          'pending',
          ${email ?? null},
          ${endereco ?? null},
          ${total},
          ${JSON.stringify(validatedItems)}
        )
        ON CONFLICT (payment_id) DO NOTHING
      `
    }

    return NextResponse.json({ init_point: result.init_point, id: result.id })
  } catch (err) {
    console.error('Erro ao criar preferência MP:', err)
    return NextResponse.json({ error: 'Erro ao iniciar pagamento.' }, { status: 500 })
  }
}
