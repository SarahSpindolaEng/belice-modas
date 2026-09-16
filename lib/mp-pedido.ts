/**
 * Registra um pagamento do Mercado Pago no banco (usado pelo webhook,
 * pela página de confirmação e pela sincronização do painel admin).
 * Sempre consulta o pagamento direto na API do MP — nunca confia em dados do navegador.
 */
import { MercadoPagoConfig, Payment } from 'mercadopago'
import nodemailer from 'nodemailer'
import { mpAccessToken } from '@/lib/mp'
import sql from '@/lib/db'

const client = new MercadoPagoConfig({ accessToken: mpAccessToken() })

function escapeHtml(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export interface ResultadoRegistro {
  paymentId: string
  status: string | null
  emailRef: string | null
  orderRef: string | null
  novo: boolean
}

export function lerReferencia(ext: string | null | undefined): { email: string | null; pedido: string | null } {
  try {
    const ref = ext ? JSON.parse(ext) : null
    return {
      email: typeof ref?.email === 'string' ? ref.email : null,
      pedido: typeof ref?.pedido === 'string' ? ref.pedido : null,
    }
  } catch {
    return { email: null, pedido: null }
  }
}

export async function registrarPagamento(id: string | number): Promise<ResultadoRegistro> {
  const data = await new Payment(client).get({ id: String(id) })
  const paymentId = String(data.id)
  const ref = lerReferencia(data.external_reference)
  const resultado: ResultadoRegistro = {
    paymentId,
    status: data.status ?? null,
    emailRef: ref.email,
    orderRef: ref.pedido,
    novo: false,
  }
  if (data.status !== 'approved') return resultado

  const items = data.additional_info?.items ?? []
  const total = data.transaction_amount
  const payerEmail = ref.email ?? data.payer?.email ?? null
  const prefKey = 'pref_' + String((data as any).preference_id ?? '-')

  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_ref text`

  // 1) Promove o pedido pending criado no checkout (mantém endereço e dados de envio)
  const promovido = await sql`
    UPDATE orders SET
      status = 'approved',
      payment_id = ${paymentId},
      payment_type = ${data.payment_type_id ?? null}
    WHERE (order_ref = ${ref.pedido ?? '-'} OR payment_id = ${prefKey})
      AND status = 'pending'
      AND NOT EXISTS (SELECT 1 FROM orders WHERE payment_id = ${paymentId})
    RETURNING id
  `
  if (promovido.length > 0) {
    resultado.novo = true
  } else {
    // 2) Sem pending (pedido antigo ou notificação repetida): upsert pelo payment_id
    const up = (await sql`
      INSERT INTO orders (payment_id, payment_type, status, payer_email, total, items)
      VALUES (${paymentId}, ${data.payment_type_id ?? null}, 'approved', ${payerEmail}, ${total ?? 0}, ${JSON.stringify(items)})
      ON CONFLICT (payment_id) DO UPDATE SET
        status = CASE WHEN orders.status = 'cancelled' THEN orders.status ELSE 'approved' END,
        payment_type = EXCLUDED.payment_type,
        payer_email = COALESCE(orders.payer_email, EXCLUDED.payer_email)
      RETURNING (xmax = 0) AS inserido
    `) as { inserido: boolean }[]
    resultado.novo = !!up[0]?.inserido
  }

  if (resultado.novo) {
    try {
      await enviarEmailPedido(paymentId, String(data.payment_type_id ?? ''), payerEmail, items, total)
    } catch (err) {
      console.error('Falha ao enviar e-mail de novo pedido:', err)
    }
  }
  return resultado
}

async function enviarEmailPedido(paymentId: string, tipo: string, email: string | null, items: any[], total: number | undefined) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD.replace(/\s/g, '') },
  })
  const itemsHtml = items.map((item: any) =>
    '<tr>' +
    '<td style="padding:8px;border-bottom:1px solid #eee">' + escapeHtml(item.title) + (item.description ? ' (' + escapeHtml(item.description) + ')' : '') + '</td>' +
    '<td style="padding:8px;border-bottom:1px solid #eee;text-align:center">' + escapeHtml(item.quantity) + '</td>' +
    '<td style="padding:8px;border-bottom:1px solid #eee;text-align:right">R$ ' + Number(item.unit_price).toFixed(2) + '</td>' +
    '</tr>'
  ).join('')
  await transporter.sendMail({
    from: '"Belice Modas" <' + process.env.GMAIL_USER + '>',
    to: process.env.GMAIL_USER,
    subject: 'Novo pedido aprovado! #' + paymentId,
    html:
      '<div style="font-family:sans-serif;max-width:600px;margin:0 auto">' +
      '<h2 style="color:#1a1a1a">Novo pedido recebido</h2>' +
      '<p><strong>Pagamento:</strong> #' + escapeHtml(paymentId) + ' — ' + escapeHtml(tipo) + '</p>' +
      '<p><strong>Cliente:</strong> ' + escapeHtml(email ?? 'Não informado') + '</p>' +
      '<table style="width:100%;border-collapse:collapse;margin:16px 0">' +
      '<tr style="background:#f5f5f5"><th style="padding:8px;text-align:left">Produto</th><th style="padding:8px;text-align:center">Qtd</th><th style="padding:8px;text-align:right">Valor</th></tr>' +
      itemsHtml +
      '</table>' +
      '<p style="font-size:18px"><strong>Total: R$ ' + Number(total ?? 0).toFixed(2) + '</strong></p>' +
      '</div>',
  })
}

/** Procura no MP pagamentos aprovados para pedidos pending recentes e registra. */
export async function sincronizarPendentes(dias = 14): Promise<{ verificados: number; registrados: number }> {
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_ref text`
  const pendentes = (await sql`
    SELECT payer_email, order_ref FROM orders
    WHERE status = 'pending' AND order_ref IS NOT NULL
      AND created_at > now() - (interval '1 day' * ${dias})
    ORDER BY created_at DESC
    LIMIT 50
  `) as { payer_email: string | null; order_ref: string }[]

  let registrados = 0
  for (const p of pendentes) {
    const ext = JSON.stringify({ email: p.payer_email, pedido: p.order_ref })
    const url = `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(ext)}&status=approved&limit=5`
    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${mpAccessToken()}` }, signal: AbortSignal.timeout(10_000) })
      if (!res.ok) continue
      const json = await res.json()
      for (const pay of json.results ?? []) {
        const r = await registrarPagamento(pay.id)
        if (r.novo) registrados++
      }
    } catch (err) {
      console.error('Sincronização MP falhou para', p.order_ref, err)
    }
  }
  return { verificados: pendentes.length, registrados }
}
