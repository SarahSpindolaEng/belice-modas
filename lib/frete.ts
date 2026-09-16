/**
 * Cotação de frete no Melhor Envio — usada pela rota /api/frete e pelo checkout
 * (o checkout recalcula no servidor para o cliente não conseguir alterar o valor).
 */
import { getMEBase } from '@/lib/me-token'
import { montarPacote, type ItemPacote } from '@/lib/embalagem'

export interface OpcaoFrete {
  id: number
  nome: string
  transportadora: string
  preco: number
  prazo: number
  logo: string | null
}

export function freteDisponivel(): boolean {
  return !!process.env.MELHOR_ENVIO_TOKEN
}

export async function cotarFrete(cepDestino: string, itens: ItemPacote[]): Promise<OpcaoFrete[] | null> {
  const token = process.env.MELHOR_ENVIO_TOKEN
  if (!token) return null

  const cepOrigem = (process.env.LOJA_CEP_ORIGEM ?? '').replace(/\D/g, '')
  const pacote = montarPacote(itens)

  const payload = {
    from: { postal_code: cepOrigem },
    to: { postal_code: cepDestino.replace(/\D/g, '') },
    package: pacote,
    options: { receipt: false, own_hand: false },
  }

  const response = await fetch(`${getMEBase()}/api/v2/me/shipment/calculate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': `Belice Modas (${process.env.GMAIL_USER ?? 'belicemodas6@gmail.com'})`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15_000),
  })

  if (!response.ok) {
    console.error('Melhor Envio erro:', response.status, await response.text())
    return null
  }

  const data = await response.json()
  return (Array.isArray(data) ? data : [])
    .filter((s: any) => !s.error && s.price)
    .map((s: any) => ({
      id: Number(s.id),
      nome: String(s.name ?? ''),
      transportadora: String(s.company?.name ?? ''),
      preco: parseFloat(s.price),
      prazo: Number(s.delivery_time) || 0,
      logo: s.company?.picture ?? null,
    }))
    .sort((a: OpcaoFrete, b: OpcaoFrete) => a.preco - b.preco)
}
