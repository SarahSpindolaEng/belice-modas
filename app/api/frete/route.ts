import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getIp } from '@/lib/rate-limit'
import { cotarFrete, freteDisponivel } from '@/lib/frete'

export async function GET() {
  return NextResponse.json({ disponivel: freteDisponivel() })
}

export async function POST(req: NextRequest) {
  // Rate limit: máx 20 cálculos por IP a cada 5 minutos
  const { allowed } = await rateLimit(getIp(req), { maxRequests: 20, windowMs: 5 * 60 * 1000 })
  if (!allowed) {
    return NextResponse.json({ error: 'Muitas requisições. Aguarde alguns minutos.' }, { status: 429 })
  }

  try {
    const body = await req.json().catch(() => null)
    const cep = typeof body?.cep_destino === 'string' ? body.cep_destino.replace(/\D/g, '') : ''
    if (!/^\d{8}$/.test(cep)) {
      return NextResponse.json({ error: 'CEP inválido.' }, { status: 400 })
    }

    if (!freteDisponivel()) {
      return NextResponse.json({ error: 'Cálculo de frete indisponível no momento.' }, { status: 503 })
    }

    // Itens do carrinho (id + quantidade) para calcular peso/embalagem.
    // Compatível com o formato antigo (só quantidade → trata como vestidos).
    let itens: { id?: unknown; quantity?: unknown }[] = []
    if (Array.isArray(body?.itens)) {
      itens = body.itens.slice(0, 50).map((i: any) => ({ id: typeof i?.id === 'string' ? i.id : undefined, quantity: i?.quantity }))
    } else {
      const qtd = Math.max(1, Math.min(99, Math.floor(Number(body?.quantidade)) || 1))
      itens = [{ id: undefined, quantity: qtd }]
    }

    const opcoes = await cotarFrete(cep, itens)
    if (!opcoes) {
      return NextResponse.json({ error: 'Não foi possível calcular o frete. Tente novamente.' }, { status: 502 })
    }

    // mostra apenas as 3 mais baratas
    return NextResponse.json({ opcoes: opcoes.slice(0, 3) })
  } catch (err) {
    console.error('Erro interno /api/frete:', err)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
