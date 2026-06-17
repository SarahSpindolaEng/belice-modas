import { NextRequest, NextResponse } from 'next/server'
import { getMEBase } from '@/lib/me-token'
import { rateLimit, getIp } from '@/lib/rate-limit'

function getValidToken() {
  return process.env.MELHOR_ENVIO_TOKEN ?? null
}

const DEFAULT_PACKAGE = {
  height: 10,
  width: 30,
  length: 40,
  weight: 0.5,
}

export async function GET() {
  const token = await getValidToken()
  return NextResponse.json({ disponivel: !!token })
}

export async function POST(req: NextRequest) {
  // Rate limit: máx 20 cálculos por IP a cada 5 minutos
  const { allowed } = await rateLimit(getIp(req), { maxRequests: 20, windowMs: 5 * 60 * 1000 })
  if (!allowed) {
    return NextResponse.json(
      { error: 'Muitas requisições. Aguarde alguns minutos.' },
      { status: 429 },
    )
  }

  try {
    const { cep_destino, quantidade } = await req.json()

    if (!cep_destino || !/^\d{8}$/.test(cep_destino.replace('-', ''))) {
      return NextResponse.json({ error: 'CEP inválido.' }, { status: 400 })
    }

    const token = await getValidToken()
    if (!token) {
      return NextResponse.json(
        { error: 'Cálculo de frete indisponível no momento.' },
        { status: 401 },
      )
    }

    const cepOrigem = (process.env.LOJA_CEP_ORIGEM ?? '').replace(/\D/g, '')
    const base = getMEBase()
    // Garante que qtd seja inteiro entre 1 e 100
    // ATENÇÃO: Number(-999) = -999, que é truthy — || 1 não funcionaria aqui
    const qtd = Math.max(1, Math.min(100, Math.floor(Number(quantidade)) || 1))

    const payload = {
      from: { postal_code: cepOrigem },
      to: { postal_code: cep_destino.replace(/\D/g, '') },
      products: Array.from({ length: qtd }, (_, i) => ({
        id: String(i + 1),
        width: DEFAULT_PACKAGE.width,
        height: DEFAULT_PACKAGE.height,
        length: DEFAULT_PACKAGE.length,
        weight: DEFAULT_PACKAGE.weight,
        insurance_value: 0,
        quantity: 1,
      })),
      options: { receipt: false, own_hand: false },
      services: '',
    }

    const response = await fetch(`${base}/api/v2/me/shipment/calculate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'Belice Modas (sarahgiulia2005@gmail.com)',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Melhor Envio erro:', err)
      return NextResponse.json(
        { error: 'Não foi possível calcular o frete. Tente novamente.' },
        { status: 502 },
      )
    }

    const data = await response.json()

    const opcoes = (Array.isArray(data) ? data : [])
      .filter((s: any) => !s.error && s.price)
      .map((s: any) => ({
        id: s.id,
        nome: s.name,
        transportadora: s.company?.name ?? '',
        preco: parseFloat(s.price),
        prazo: s.delivery_time,
        logo: s.company?.picture ?? null,
      }))
      .sort((a: any, b: any) => a.preco - b.preco)

    return NextResponse.json({ opcoes })
  } catch (err) {
    console.error('Erro interno /api/frete:', err)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
