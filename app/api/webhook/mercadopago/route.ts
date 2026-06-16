import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import nodemailer from 'nodemailer'
import sql from '@/lib/db'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, ''),
  },
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.type !== 'payment') {
      return NextResponse.json({ ok: true })
    }

    const payment = new Payment(client)
    const data = await payment.get({ id: body.data.id })

    if (data.status !== 'approved') {
      return NextResponse.json({ ok: true })
    }

    const items = data.additional_info?.items ?? []
    const payer = data.payer
    const total = data.transaction_amount

    // Salvar no banco de dados
    try {
      await sql`
        INSERT INTO orders (payment_id, payment_type, status, payer_email, total, items)
        VALUES (
          ${String(data.id)},
          ${data.payment_type_id ?? null},
          'approved',
          ${payer?.email ?? null},
          ${total ?? 0},
          ${JSON.stringify(items)}
        )
        ON CONFLICT (payment_id) DO NOTHING
      `
    } catch (dbErr) {
      console.error('Erro ao salvar pedido no banco:', dbErr)
      // Continua para enviar o email mesmo se o banco falhar
    }

    // Enviar email de notificação
    const itemsHtml = items.map((item: any) =>
      '<tr>' +
      '<td style="padding:8px;border-bottom:1px solid #eee">' + item.title + (item.description ? ' (' + item.description + ')' : '') + '</td>' +
      '<td style="padding:8px;border-bottom:1px solid #eee;text-align:center">' + item.quantity + '</td>' +
      '<td style="padding:8px;border-bottom:1px solid #eee;text-align:right">R$ ' + Number(item.unit_price).toFixed(2) + '</td>' +
      '</tr>'
    ).join('')

    await transporter.sendMail({
      from: '"Belice Modas" <' + process.env.GMAIL_USER + '>',
      to: process.env.GMAIL_USER,
      subject: 'Novo pedido aprovado! #' + data.id,
      html:
        '<div style="font-family:sans-serif;max-width:600px;margin:0 auto">' +
        '<h2 style="color:#1a1a1a">Novo pedido recebido</h2>' +
        '<p><strong>Pagamento:</strong> #' + data.id + ' — ' + data.payment_type_id + '</p>' +
        '<p><strong>Cliente:</strong> ' + (payer?.email ?? 'Não informado') + '</p>' +
        '<table style="width:100%;border-collapse:collapse;margin:16px 0">' +
        '<tr style="background:#f5f5f5">' +
        '<th style="padding:8px;text-align:left">Produto</th>' +
        '<th style="padding:8px;text-align:center">Qtd</th>' +
        '<th style="padding:8px;text-align:right">Valor</th>' +
        '</tr>' +
        itemsHtml +
        '</table>' +
        '<p style="font-size:18px"><strong>Total: R$ ' + Number(total).toFixed(2) + '</strong></p>' +
        '</div>',
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook MP erro:', err)
    return NextResponse.json({ ok: true })
  }
}
