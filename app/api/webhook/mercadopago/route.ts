import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { registrarPagamento } from '@/lib/mp-pedido'

/**
 * Verifica assinatura do Mercado Pago (x-signature header).
 * Docs: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
function verificarAssinaturaMP(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) {
    // Em producao, recusar webhooks sem segredo (fail-closed). Em dev, permitir p/ testes.
    if (process.env.NODE_ENV === 'production') {
      console.error('MP_WEBHOOK_SECRET ausente em producao — webhook recusado. Configure a variavel no Vercel.')
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
    console.warn('Webhook MP rejeitado: sem x-signature')
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
  if (diff !== 0) console.warn('Webhook MP rejeitado: assinatura não confere (confira MP_WEBHOOK_SECRET)')
  return diff === 0
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()

    if (!verificarAssinaturaMP(req, rawBody)) {
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 })
    }

    const body = JSON.parse(rawBody)
    const tipo = body.type ?? body.topic
    const id = body.data?.id ?? new URL(req.url).searchParams.get('data.id')

    if (tipo !== 'payment' || !id) {
      return NextResponse.json({ ok: true })
    }

    const r = await registrarPagamento(String(id))
    console.log('Webhook MP processado', { id: r.paymentId, status: r.status, novo: r.novo })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Webhook MP erro:', err)
    return NextResponse.json({ ok: true })
  }
}
