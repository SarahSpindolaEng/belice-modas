import { NextRequest, NextResponse } from 'next/server'
import { mpAccessToken } from '@/lib/mp'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { products, testProduct, TEST_PRODUCT_ID } from '@/lib/products'
import { isAdmin } from '@/lib/admin-emails'
import { rateLimit, getIp } from '@/lib/rate-limit'
import { auth } from '@/auth'
import { cotarFrete } from '@/lib/frete'
import { encrypt } from '@/lib/crypto'
import sql from '@/lib/db'
import { randomUUID } from 'crypto'

const client = new MercadoPagoConfig({
  accessToken: mpAccessToken(),
})

// Colunas para a etiqueta (migração lazy, idempotente).
let schemaReady: Promise<unknown> | null = null
function ensureSchema() {
  if (!schemaReady) {
    schemaReady = Promise.all([
      sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS dados_envio jsonb`,
      sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS preference_id text`,
      sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_ref text`,
    ]).catch((err) => {
      schemaReady = null
      throw err
    })
  }
  return schemaReady
}

const limpar = (v: unknown, max = 120) =>
  typeof v === 'string' ? v.replace(/[<>]/g, '').trim().slice(0, max) : ''
const digits = (v: unknown) => (typeof v === 'string' ? v.replace(/\D/g, '') : '')

export async function POST(req: NextRequest) {
  const { allowed } = await rateLimit(getIp(req), { maxRequests: 10, windowMs: 10 * 60 * 1000 })
  if (!allowed) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde alguns minutos.' }, { status: 429 })
  }

  // Compra exige login (Google). O e-mail do pedido é SEMPRE o da sessão,
  // nunca o enviado pelo navegador.
  const session = await auth()
  const email = session?.user?.email?.toLowerCase() ?? null
  if (!email) {
    return NextResponse.json({ error: 'Faça login para finalizar a compra.', login: true }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Requisição inválida.' }, { status: 400 })
    }
    const items = body.items

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Carrinho vazio.' }, { status: 400 })
    }
    if (items.length > 50) {
      return NextResponse.json({ error: 'Carrinho inválido.' }, { status: 400 })
    }

    // Validar itens contra catálogo real (preço vem do servidor, nunca do navegador)
    const validatedItems = []
    for (const item of items) {
      const product =
        products.find((p) => p.id === item?.id) ??
        (item?.id === TEST_PRODUCT_ID && isAdmin(email) ? testProduct : undefined)
      if (!product) return NextResponse.json({ error: 'Produto não encontrado.' }, { status: 400 })
      if (product.price <= 0 || product.pendingPrice) {
        return NextResponse.json({ error: `Produto indisponível: ${product.name}` }, { status: 400 })
      }
      const quantity = Math.max(1, Math.min(99, Math.floor(Number(item.quantity)) || 1))
      const color = limpar(item.color, 40)
      const size = limpar(item.size, 20)
      validatedItems.push({
        id: product.id,
        title: product.name,
        quantity,
        unit_price: product.price,
        currency_id: 'BRL',
        category_id: 'fashion',
        description: color ? color + (size ? ' - ' + size : '') : size,
        picture_url: product.images[0] ?? undefined,
      })
    }

    // Entrega x retirada
    const de = body.dadosEnvio
    const retirada = !de || typeof de !== 'object'
    let dadosEnvio: Record<string, unknown> | null = null
    let enderecoTexto = 'Retirada na loja'
    let payerExtra: Record<string, unknown> = {}
    let freteItem: { id: string; title: string; quantity: number; unit_price: number; currency_id: string; category_id: string } | null = null

    if (!retirada) {
      const d = {
        nome: limpar(de.nome),
        cpf: digits(de.cpf),
        telefone: digits(de.telefone),
        cep: digits(de.cep),
        rua: limpar(de.rua),
        numero: limpar(de.numero, 20),
        complemento: limpar(de.complemento),
        bairro: limpar(de.bairro),
        cidade: limpar(de.cidade),
        estado: limpar(de.estado, 2).toUpperCase(),
      }
      const serviceId = Math.floor(Number(de.frete_service_id))

      if (!d.nome || !d.rua || !d.numero || !d.bairro || !d.cidade || !/^[A-Z]{2}$/.test(d.estado)) {
        return NextResponse.json({ error: 'Endereço incompleto.' }, { status: 400 })
      }
      if (!/^\d{11}$/.test(d.cpf)) return NextResponse.json({ error: 'CPF inválido.' }, { status: 400 })
      if (!/^\d{10,11}$/.test(d.telefone)) return NextResponse.json({ error: 'Telefone inválido.' }, { status: 400 })
      if (!/^\d{8}$/.test(d.cep)) return NextResponse.json({ error: 'CEP inválido.' }, { status: 400 })
      if (!serviceId) return NextResponse.json({ error: 'Selecione uma opção de frete.' }, { status: 400 })

      // Recalcula o frete no servidor — o valor do navegador é ignorado.
      const opcoes = await cotarFrete(d.cep, validatedItems)
      const opcao = opcoes?.find((o) => o.id === serviceId)
      if (!opcao) {
        return NextResponse.json(
          { error: 'Não foi possível confirmar o frete. Calcule novamente no carrinho.' },
          { status: 409 },
        )
      }

      // Dados do comprador para o antifraude do Mercado Pago (não são salvos em texto puro)
      const partesNome = d.nome.split(/\s+/)
      payerExtra = {
        name: partesNome[0],
        surname: partesNome.slice(1).join(' ') || undefined,
        phone: { area_code: d.telefone.slice(0, 2), number: d.telefone.slice(2) },
        identification: { type: 'CPF', number: d.cpf },
        address: { zip_code: d.cep, street_name: d.rua, street_number: d.numero },
      }

      freteItem = {
        id: 'frete',
        title: `Frete - ${opcao.transportadora} ${opcao.nome}`.slice(0, 120),
        quantity: 1,
        unit_price: Math.round(opcao.preco * 100) / 100,
        currency_id: 'BRL',
        category_id: 'services',
      }

      dadosEnvio = {
        ...d,
        cpf: encrypt(d.cpf),
        frete_service_id: opcao.id,
        frete_nome: `${opcao.transportadora} ${opcao.nome}`.trim(),
        frete_preco: freteItem.unit_price,
      }
      const cepFmt = `${d.cep.slice(0, 5)}-${d.cep.slice(5)}`
      enderecoTexto = `${d.nome} · ${d.rua}, ${d.numero}${d.complemento ? ' ' + d.complemento : ''} · ${d.bairro} · ${d.cidade}/${d.estado} · CEP ${cepFmt} · Tel: ${d.telefone}`
    }

    const mpItems = freteItem ? [...validatedItems, freteItem] : validatedItems
    const total = mpItems.reduce((s, i) => s + i.unit_price * i.quantity, 0)

    // Referência própria do pedido: liga o pagamento (webhook) ao pedido pending
    const orderRef = randomUUID()
    await ensureSchema()

    const preference = new Preference(client)
    const appUrl = process.env.APP_URL || 'http://localhost:3000'

    const result = await preference.create({
      body: {
        items: mpItems,
        payer: {
          ...(retirada && session?.user?.name
            ? { name: session.user.name.split(/\s+/)[0], surname: session.user.name.split(/\s+/).slice(1).join(' ') || undefined }
            : {}),
          ...payerExtra,
          email,
          authentication_type: 'Gmail',
        },
        external_reference: JSON.stringify({ email, pedido: orderRef }),
        back_urls: {
          success: `${appUrl}/pedido/confirmacao?status=approved`,
          failure: `${appUrl}/pedido/confirmacao?status=failure`,
          pending: `${appUrl}/pedido/confirmacao?status=pending`,
        },
        auto_return: 'approved',
        payment_methods: { installments: 12 },
        statement_descriptor: 'BELICE MODAS',
        notification_url: `${appUrl}/api/webhook/mercadopago`,
      },
    })

    // Salva pedido como pending para o webhook atualizar depois
    if (result.id) {
      await sql`
        INSERT INTO orders (payment_id, payment_type, status, payer_email, endereco, total, items, dados_envio, preference_id, order_ref)
        VALUES (
          ${'pref_' + result.id},
          'preference',
          'pending',
          ${email},
          ${enderecoTexto},
          ${total},
          ${JSON.stringify(mpItems)},
          ${dadosEnvio ? JSON.stringify(dadosEnvio) : null},
          ${String(result.id)},
          ${orderRef}
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
