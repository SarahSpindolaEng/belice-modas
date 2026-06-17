/**
 * Geração de etiqueta no Melhor Envio.
 * Fluxo: carrinho (/me/cart) -> compra (/me/shipment/checkout) -> gerar
 * (/me/shipment/generate) -> imprimir (/me/shipment/print).
 *
 * Usa o token fixo MELHOR_ENVIO_TOKEN e os dados do remetente (loja) via env LOJA_*.
 * Defensivo: cada passo verifica o retorno; em caso de falha, retorna { ok:false, erro }.
 */
import { getMEBase } from '@/lib/me-token'

interface DadosEnvio {
  nome: string
  cpf: string
  telefone: string
  cep: string
  rua: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  estado: string
  frete_service_id: number
  frete_nome?: string
}

interface OrderItem {
  title?: string
  name?: string
  quantity?: number
  unit_price?: number
}

export interface ResultadoEtiqueta {
  ok: boolean
  melhorEnvioId?: string
  tracking?: string | null
  labelUrl?: string
  erro?: string
}

const PACOTE_PADRAO = { height: 10, width: 30, length: 40, weight: 0.5 }

function digits(v: string | undefined | null): string {
  return (v ?? '').replace(/\D/g, '')
}

async function meFetch(path: string, token: string, body: unknown) {
  const res = await fetch(`${getMEBase()}/api/v2${path}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'User-Agent': `Belice Modas (${process.env.GMAIL_USER ?? 'belicemodas6@gmail.com'})`,
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let data: any = null
  try { data = text ? JSON.parse(text) : null } catch {}
  return { ok: res.ok, status: res.status, data, text }
}

export async function gerarEtiqueta(order: {
  total: number | string
  items: unknown
  dados_envio: DadosEnvio | null
}): Promise<ResultadoEtiqueta> {
  const token = process.env.MELHOR_ENVIO_TOKEN
  if (!token) return { ok: false, erro: 'MELHOR_ENVIO_TOKEN não configurado no servidor.' }

  const d = order.dados_envio
  if (!d || !d.frete_service_id) {
    return { ok: false, erro: 'Pedido sem dados de envio ou serviço de frete (retirada na loja ou pedido antigo). Gere a etiqueta manualmente.' }
  }

  // Remetente (loja) — variáveis de ambiente LOJA_*
  const lojaCnpj = digits(process.env.LOJA_CNPJ)
  const lojaCpf = digits(process.env.LOJA_DOCUMENTO)
  const from: Record<string, unknown> = {
    name: process.env.LOJA_NOME ?? 'Belice Modas',
    phone: digits(process.env.LOJA_TELEFONE),
    email: process.env.LOJA_EMAIL ?? process.env.GMAIL_USER ?? '',
    address: process.env.LOJA_ENDERECO ?? '',
    complement: process.env.LOJA_COMPLEMENTO ?? '',
    number: process.env.LOJA_NUMERO ?? '',
    district: process.env.LOJA_BAIRRO ?? '',
    city: process.env.LOJA_CIDADE ?? '',
    state_abbr: process.env.LOJA_ESTADO ?? '',
    postal_code: digits(process.env.LOJA_CEP_ORIGEM),
    country_id: 'BR',
    state_register: 'ISENTO',
  }
  if (lojaCnpj) from.company_document = lojaCnpj
  if (lojaCpf) from.document = lojaCpf

  if (!from.postal_code || !from.address || !from.number || !from.city || !from.state_abbr || (!from.document && !from.company_document)) {
    return { ok: false, erro: 'Dados do remetente (loja) incompletos. Configure as variáveis LOJA_* no Vercel (nome, documento, endereço, número, bairro, cidade, estado, CEP).' }
  }

  const to: Record<string, unknown> = {
    name: d.nome,
    phone: digits(d.telefone),
    email: '',
    document: digits(d.cpf),
    address: d.rua,
    complement: d.complemento ?? '',
    number: d.numero,
    district: d.bairro,
    city: d.cidade,
    state_abbr: d.estado,
    postal_code: digits(d.cep),
    country_id: 'BR',
    state_register: 'ISENTO',
  }
  if (!to.document) return { ok: false, erro: 'CPF do destinatário ausente no pedido — não é possível gerar a etiqueta.' }

  const itens: OrderItem[] = Array.isArray(order.items) ? (order.items as OrderItem[]) : []
  const products = itens.map((i) => ({
    name: String(i.title ?? i.name ?? 'Produto').slice(0, 60),
    quantity: String(i.quantity ?? 1),
    unitary_value: String(Number(i.unit_price ?? 0) || 1),
  }))
  if (products.length === 0) {
    products.push({ name: 'Pedido Belice Modas', quantity: '1', unitary_value: String(Number(order.total) || 1) })
  }

  const options = {
    insurance_value: Number(order.total) || 0,
    receipt: false,
    own_hand: false,
    reverse: false,
    non_commercial: true,
  }

  // 1) Inserir no carrinho
  const cart = await meFetch('/me/cart', token, {
    service: Number(d.frete_service_id),
    from,
    to,
    products,
    volumes: [PACOTE_PADRAO],
    options,
  })
  if (!cart.ok || !cart.data?.id) {
    return { ok: false, erro: `Falha ao inserir no carrinho do Melhor Envio: ${cart.data?.message ?? (cart.text ? cart.text.slice(0, 200) : 'status ' + cart.status)}` }
  }
  const meId: string = cart.data.id

  // 2) Comprar (checkout) — desconta saldo
  const checkout = await meFetch('/me/shipment/checkout', token, { orders: [meId] })
  if (!checkout.ok) {
    return { ok: false, melhorEnvioId: meId, erro: `Falha ao pagar a etiqueta (verifique o saldo da conta Melhor Envio): ${checkout.data?.message ?? 'status ' + checkout.status}` }
  }

  // 3) Gerar
  const generate = await meFetch('/me/shipment/generate', token, { orders: [meId] })
  if (!generate.ok) {
    return { ok: false, melhorEnvioId: meId, erro: `Etiqueta comprada, mas falhou ao gerar: ${generate.data?.message ?? 'status ' + generate.status}` }
  }
  let tracking: string | null = null
  try {
    const g: any = generate.data
    if (g && typeof g === 'object' && g[meId]) tracking = g[meId].tracking ?? null
  } catch {}

  // 4) Link de impressão público
  const print = await meFetch('/me/shipment/print', token, { mode: 'public', orders: [meId] })
  const labelUrl: string | undefined = print.ok ? print.data?.url : undefined

  return {
    ok: true,
    melhorEnvioId: meId,
    tracking,
    labelUrl,
    erro: labelUrl ? undefined : 'Etiqueta gerada, mas o link de impressão não veio — gere a impressão no painel do Melhor Envio.',
  }
}
