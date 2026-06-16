import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

export async function POST(req: NextRequest) {
  try {
    const { items, email } = await req.json()

    const preference = new Preference(client)

    const result = await preference.create({
      body: {
        items: items.map((item: any) => ({
          id: item.id,
          title: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          currency_id: 'BRL',
          description: item.color ? item.color + (item.size ? ' - ' + item.size : '') : item.size ?? '',
          picture_url: item.image,
        })),
        payer: email ? { email } : undefined,
        back_urls: {
          success: (process.env.APP_URL || 'http://localhost:3000') + '/pedido/confirmacao?status=approved',
          failure: (process.env.APP_URL || 'http://localhost:3000') + '/pedido/confirmacao?status=failure',
          pending: (process.env.APP_URL || 'http://localhost:3000') + '/pedido/confirmacao?status=pending',
        },
        auto_return: 'approved',
        statement_descriptor: 'BELICE MODAS',
        notification_url: (process.env.APP_URL || 'http://localhost:3000') + '/api/webhook/mercadopago',
      },
    })

    return NextResponse.json({ init_point: result.init_point, id: result.id })
  } catch (err) {
    console.error('Erro ao criar preferência MP:', err)
    return NextResponse.json({ error: 'Erro ao iniciar pagamento.' }, { status: 500 })
  }
}
