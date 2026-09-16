/**
 * Peso e embalagem médios por tipo de peça — usados na cotação do frete
 * e na etiqueta (os dois precisam bater, senão a transportadora cobra diferença).
 *
 * VALORES ESTIMADOS: pese algumas peças já embaladas e ajuste aqui.
 * Pesos em kg, medidas em cm.
 */
import { products, TEST_PRODUCT_ID } from '@/lib/products'

type TipoPeca = 'vestido' | 'saia' | 'calca' | 'bermuda' | 'jardineira' | 'outro'

// Peso médio da peça (sem embalagem) e altura que ela ocupa dobrada
const PECAS: Record<TipoPeca, { peso: number; altura: number }> = {
  vestido:    { peso: 0.35, altura: 4 },
  saia:       { peso: 0.25, altura: 3 },
  calca:      { peso: 0.55, altura: 5 },
  bermuda:    { peso: 0.35, altura: 4 },
  jardineira: { peso: 0.65, altura: 6 },
  outro:      { peso: 0.40, altura: 4 },
}

// Embalagem média (envelope/caixa para roupa dobrada)
export const EMBALAGEM = {
  largura: 25,     // cm
  comprimento: 32, // cm
  alturaMin: 4,    // cm (mínimo aceito pelas transportadoras é 2)
  alturaMax: 60,   // cm
  pesoBase: 0.10,  // kg — caixa/envelope + papel de seda
  pesoPorPeca: 0.02, // kg — saquinho/etiqueta por peça
}

function tipoDoProduto(id: unknown): TipoPeca {
  if (id === TEST_PRODUCT_ID) return 'vestido' // teste simula um vestido
  const p = products.find((pr) => pr.id === id)
  if (!p) return 'outro'
  if (p.category === 'vestidos') return 'vestido'
  if (p.category === 'saias') return 'saia'
  switch (p.subcategoria) {
    case 'calca': return 'calca'
    case 'bermuda': return 'bermuda'
    case 'jardineira': return 'jardineira'
    case 'saia': return 'saia'
    default: return 'outro'
  }
}

export interface ItemPacote {
  id?: unknown
  quantity?: unknown
}

export interface Pacote {
  width: number
  height: number
  length: number
  weight: number
}

/** Monta um único pacote com todas as peças do pedido. */
export function montarPacote(itens: ItemPacote[]): Pacote {
  let peso = EMBALAGEM.pesoBase
  let altura = 0
  let pecas = 0
  for (const item of itens) {
    if (item.id === 'frete') continue
    const qtd = Math.max(1, Math.min(99, Math.floor(Number(item.quantity)) || 1))
    const t = PECAS[tipoDoProduto(item.id)]
    peso += (t.peso + EMBALAGEM.pesoPorPeca) * qtd
    altura += t.altura * qtd
    pecas += qtd
  }
  if (pecas === 0) {
    peso += PECAS.vestido.peso + EMBALAGEM.pesoPorPeca
    altura = PECAS.vestido.altura
  }
  return {
    width: EMBALAGEM.largura,
    length: EMBALAGEM.comprimento,
    height: Math.min(EMBALAGEM.alturaMax, Math.max(EMBALAGEM.alturaMin, Math.ceil(altura))),
    weight: Math.round(peso * 100) / 100,
  }
}
