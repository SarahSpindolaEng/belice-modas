import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createHmac } from 'crypto'
import nodemailer from 'nodemailer'
import sql from '@/lib/db'

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
})

/**
 * Verifica assinatura do Mercado Pago (x-signature header).
 * Docs: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
function verificarAssinaturaMP(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) return true // sem secret configurado, aceita (modo dev)

  const xSignature = req.headers.get('x-signature')
  const xRequestId = req.headers.get('x-request-id')
  const dataId = new URL(req.url).searchParams.get('data.id') ?? ''

  if (!xSignature) return false

  // Formato: ts=...,v1=...
  const parts = Object.fromEntries(
    xSignature.split(',').map((p) => p.split('=') as [string, string]),
  )
  const ts = parts['ts']
  const hash = parts['v1']
  if (!ts || !hash) return false

  // Proteção contra replay attack: rejeita webhooks com timestamp > 5 minutos
  const tsNum = Number(ts)
  const ageSeconds = (Date.now() / 1000) - tsNum
  if (!isNaN(tsNum) && (ageSeconds > 300 || ageSeconds < -60)) {
    console.warn('Webhook MP rejeitado: timestamp fora do intervalo', { ageSeconds })
    return false
  }

  const manifest = `id:${dataId};request-id:${xRequestId ?? ''};ts:${ts};`
  const expected = createHmac('sha256', secret).update(manifest).digest('hex')

  // Comparação em tempo constante para evitar timing attack
  if (expected.length !== hash.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ hash.charCodeAt(i)
  }
  return diff === 0
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, ''),
  },
})

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()

    if (!verificarAssinaturaMP(req, rawBody)) {
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
    }

    const body = JSON.parse(rawBody)

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

    // Recuperar endereço do external_reference
    let endereco: string | null = null
    let payerEmail = payer?.email ?? null
    try {
      const ref = data.external_reference ? JSON.parse(data.external_reference) : null
      if (ref?.endereco) endereco = ref.endereco
      if (ref?.email && !payerEmail) payerEmail = ref.email
    } catch {}

    // Salvar no banco de dados
    try {
      await sql`
        INSERT INTO orders (payment_id, payment_type, status, payer_email, endereco, total, items)
        VALUES (
          ${String(data.id)},
          ${data.payment_type_id ?? null},
          'approved',
          ${payerEmail},
          ${endereco},
          ${total ?? 0},
          ${JSON.stringify(items)}
        )
        ON CONFLICT (payment_id) DO UPDATE SET
          status = 'approved',
          payment_type = EXCLUDED.payment_type,
          payer_email = COALESCE(EXCLUDED.payer_email, orders.payer_email),
          endereco = COALESCE(EXCLUDED.endereco, orders.endereco)
      `
      // Atualizar pedido pending criado na preference
      await sql`
        UPDATE orders SET
          status = 'approved',
          payment_id = ${String(data.id)},
          payment_type = ${data.payment_type_id ?? null}
        WHERE payment_id = ${'pref_' + (data.preference_id ?? '')}
          AND status = 'pending'
      `
    } catch (dbErr) {
      console.error('Erro ao salvar pedido no banco:', dbErr)
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
