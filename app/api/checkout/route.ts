import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { products } from '@/lib/products'
import { rateLimit, getIp } from '@/lib/rate-limit'
import sql from '@/lib/db'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

// Colunas para a etiqueta (migração lazy, idempotente).
let schemaReady: Promise<unknown> | null = null
function ensureSchema() {
  if (!schemaReady) {
    schemaReady = Promise.all([
      sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS dados_envio jsonb`,
      sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS preference_id text`,
    ])
  }
  return schemaReady
}

export async function POST(req: NextRequest) {
  const { allowed } = await rateLimit(getIp(req), { maxRequests: 10, windowMs: 10 * 60 * 1000 })
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
    // Dados estruturados de envio (para gerar a etiqueta depois). Limita tamanho por seguranca.
    const limpar = (v: unknown) =>
      typeof v === 'string' ? v.replace(/[<>]/g, '').trim().slice(0, 120) : ''
    const de = body.dadosEnvio
    const dadosEnvio =
      de && typeof de === 'object'
        ? {
            nome: limpar(de.nome),
            cpf: limpar(de.cpf),
            telefone: limpar(de.telefone),
            cep: limpar(de.cep),
            rua: limpar(de.rua),
            numero: limpar(de.numero),
            complemento: limpar(de.complemento),
            bairro: limpar(de.bairro),
            cidade: limpar(de.cidade),
            estado: limpar(de.estado),
            frete_service_id: Number(de.frete_service_id) || null,
            frete_nome: limpar(de.frete_nome),
          }
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
      await ensureSchema()
      await sql`
        INSERT INTO orders (payment_id, payment_type, status, payer_email, endereco, total, items, dados_envio, preference_id)
        VALUES (
          ${'pref_' + result.id},
          'preference',
          'pending',
          ${email ?? null},
          ${endereco ?? null},
          ${total},
          ${JSON.stringify(validatedItems)},
          ${dadosEnvio ? JSON.stringify(dadosEnvio) : null},
          ${String(result.id)}
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
