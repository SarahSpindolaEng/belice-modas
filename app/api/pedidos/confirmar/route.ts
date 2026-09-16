/**
 * Chamado pela página de confirmação quando a cliente volta do Mercado Pago.
 * Consulta o pagamento direto na API do MP e registra o pedido — garante que
 * o pedido apareça mesmo se o webhook atrasar ou falhar.
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/admin-emails'
import { rateLimit, getIp } from '@/lib/rate-limit'
import { registrarPagamento } from '@/lib/mp-pedido'

export async function POST(req: NextRequest) {
  const { allowed } = await rateLimit(getIp(req), { maxRequests: 10, windowMs: 10 * 60_000 })
  if (!allowed) return NextResponse.json({ error: 'Muitas tentativas.' }, { status: 429 })

  const session = await auth()
  const email = session?.user?.email?.toLowerCase()
  if (!email) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const paymentId = typeof body?.payment_id === 'string' ? body.payment_id.replace(/\D/g, '').slice(0, 20) : ''
  if (!paymentId) return NextResponse.json({ error: 'Pagamento não informado.' }, { status: 400 })

  try {
    const r = await registrarPagamento(paymentId)
    // Só confirma pagamentos do próprio comprador (ou admin)
    if (r.emailRef?.toLowerCase() !== email && !isAdmin(email)) {
      return NextResponse.json({ error: 'Pagamento não encontrado.' }, { status: 404 })
    }
    return NextResponse.json({ status: r.status })
  } catch (err) {
    console.error('Erro ao confirmar pagamento:', err)
    return NextResponse.json({ error: 'Não foi possível confirmar agora.' }, { status: 502 })
  }
}
