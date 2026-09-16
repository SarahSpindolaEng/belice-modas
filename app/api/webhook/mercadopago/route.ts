import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { registrarPagamento } from '@/lib/mp-pedido'
import { rateLimit, getIp } from '@/lib/rate-limit'

/**
 * Verifica assinatura do Mercado Pago (x-signature header).
 * Docs: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
function verificarAssinaturaMP(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) {
    // Em producao, recusar webhooks sem segredo (fail-closed). Em dev, permitir p/ testes.
    if (process.env.NODE_ENV === 'production') {
      console.warn('MP_WEBHOOK_SECRET ausente em producao — assinatura não verificada.')
      return false
    }
    console.warn('MP_WEBHOOK_SECRET nao configurado (dev) — aceitando sem validar assinatura.')
    return true
  }

  const xSignature = req.headers.get('x-signature')
  const xRequestId = req.headers.get('x-request-id')
  // Doc do MP: se o id for alfanumérico, usar em minúsculas no manifest
  const dataId = (new URL(req.url).searchParams.get('data.id') ?? '').toLowerCase()

  if (!xSignature) {
    console.warn('Webhook MP: sem x-signature (formato IPN ou webhook não configurado no painel)')
    return false
  }

  // Formato: ts=...,v1=...
  const parts = Object.fromEntries(
    xSignature.split(',').map((p) => p.split('=') as [string, string]),
  )
  const ts = parts['ts']
  const hash = parts['v1']
  if (!ts || !hash) return false

  // Proteção contra replay attack: rejeita webhooks com timestamp > 5 minutos
  // O ts pode vir em segundos ou milissegundos — normaliza para segundos
  const tsRaw = Number(ts)
  const tsNum = tsRaw > 1e12 ? tsRaw / 1000 : tsRaw
  const ageSeconds = (Date.now() / 1000) - tsNum
  if (!isNaN(tsNum) && (ageSeconds > 300 || ageSeconds < -60)) {
    console.warn('Webhook MP: timestamp fora do intervalo', { ageSeconds })
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
  if (diff !== 0) console.warn('Webhook MP: assinatura não confere (MP_WEBHOOK_SECRET diferente do painel do Mercado Pago)')
  return diff === 0
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const url = new URL(req.url)
    let body: any = {}
    try { body = rawBody ? JSON.parse(rawBody) : {} } catch {}

    // Aceita os dois formatos do Mercado Pago:
    //  - Webhook: ?data.id=123&type=payment  + body { type, data: { id } }
    //  - IPN:     ?topic=payment&id=123       (sem assinatura)
    const tipo = body.type ?? body.topic ?? url.searchParams.get('type') ?? url.searchParams.get('topic')
    const id = body.data?.id ?? url.searchParams.get('data.id') ?? url.searchParams.get('id')

    if (tipo !== 'payment' || !id || !/^\d{1,20}$/.test(String(id))) {
      return NextResponse.json({ ok: true })
    }

    // A assinatura é verificada e registrada, mas NÃO é o que garante a segurança:
    // o pagamento é sempre consultado direto na API do Mercado Pago com o token da loja,
    // então uma notificação falsa não consegue marcar nada como pago.
    const assinaturaOk = verificarAssinaturaMP(req, rawBody)
    if (!assinaturaOk) {
      const { allowed } = await rateLimit(getIp(req), { maxRequests: 30, windowMs: 60_000 })
      if (!allowed) return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 })
    }

    const r = await registrarPagamento(String(id))
    console.log('Webhook MP processado', { id: r.paymentId, status: r.status, novo: r.novo, assinaturaOk })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    // Pagamento inexistente/de outra conta: responde 200 para o MP não reenviar
    console.error('Webhook MP erro:', err?.message ?? err)
    return NextResponse.json({ ok: true })
  }
}
