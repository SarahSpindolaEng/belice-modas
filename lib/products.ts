export type Category =
  | 'vestidos'
  | 'calcas'
  | 'saias'
  | 'bermudas'
  | 'territorial'

export type Size = 'P' | 'M' | 'G' | 'GG' | 'G1' | 'EXG' | '66'

export interface ColorOption {
  label: string
  hex: string
  imageIndex: number
  sizes?: Size[] // tamanhos disponiveis especificamente para esta cor (opcional)
}

export interface Product {
  id: string
  name: string
  category: Category
  categoryLabel: string
  description: string
  longDescription: string
  price: number
  oldPrice?: number
  images: string[]
  sizes: Size[]
  isNew?: boolean
  pendingPrice?: boolean // ⏳ preço ainda a confirmar
  colors?: ColorOption[]
}

export const categories: { slug: Category; label: string }[] = [
  { slug: 'vestidos', label: 'Vestidos' },
  { slug: 'calcas', label: 'Calças' },
  { slug: 'saias', label: 'Saias' },
  { slug: 'bermudas', label: 'Bermudas' },
  { slug: 'territorial', label: 'Marca Territorial' },
]

// ── size helpers ──────────────────────────────────────────────────────────────
const sizesPG:   Size[] = ['P', 'M', 'G']
const sizesPGG:  Size[] = ['P', 'M', 'G', 'GG']
const sizesPG1:  Size[] = ['P', 'M', 'G', 'GG', 'G1']
const sizesPEXG: Size[] = ['P', 'M', 'G', 'GG', 'G1', 'EXG']
const sizesP66:  Size[] = ['P', 'M', 'G', 'GG', 'G1', '66']

const allSizes = sizesPGG

export const products: Product[] = [

  // ── VESTIDOS ────────────────────────────────────────────────────────────────

  {
    id: 'vestido-manga-longa',
    name: 'Vestido Manga Longa',
    category: 'vestidos',
    categoryLabel: 'Vestidos',
    description: 'Vestido midi manga longa em laise azul com estampa floral. Do P ao G1.',
    longDescription: 'Vestido midi confeccionado em laise azul com manga longa e estampa floral delicada. Botões frontais perolados e saia rodada com babado. Do P ao G1.',
    price: 105,
    oldPrice: 139.90,
    images: ['/products/real/produto-03.jpg', '/products/real/produto-85.jpg', '/products/real/produto-86.jpg'],
    sizes: sizesPG1,
    isNew: true,
  },
  {
    id: 'vestido-floral-verde-midi',
    name: 'Vestido Floral Verde Midi',
    category: 'vestidos',
    categoryLabel: 'Vestidos',
    description: 'Vestido midi com estampa floral verde. Preço a confirmar.',
    longDescription: 'Vestido midi em tecido floral verde com manga curta bufante. Modelagem evasê com cinto na cintura. Preço em atualização.',
    price: 0,
    images: ['/products/real/produto-04.jpg'],
    sizes: allSizes,
    pendingPrice: true,
  },
  {
    id: 'vestido-laise-azul',
    name: 'Vestido Laise Azul',
    category: 'vestidos',
    categoryLabel: 'Vestidos',
    description: 'Vestido midi em laise azul. Preço a confirmar.',
    longDescription: 'Vestido midi em laise azul com acabamentos delicados. Modelagem que valoriza a silhueta com elegância e feminilidade. Preço em atualização.',
    price: 0,
    images: ['/products/real/produto-05.jpg'],
    sizes: allSizes,
    pendingPrice: true,
  },
  {
    id: 'vestido-cristal-pink',
    name: 'Vestido Cristal',
    category: 'vestidos',
    categoryLabel: 'Vestidos',
    description: 'Vestido Cristal em laise pink com botões frontais. Do P ao G1.',
    longDescription: 'Vestido Cristal em laise pink vibrante com botões frontais perolados. Manga 3/4 e saia evasê com babado. Disponível do P ao G1.',
    price: 105,
    oldPrice: 139.90,
    images: ['/products/real/produto-06.jpg', '/products/real/produto-88.jpg', '/products/real/produto-89.jpg'],
    sizes: sizesPG1,
    isNew: true,
  },
  {
    id: 'vestido-cristal-vinho',
    name: 'Vestido Midi Tule Cristal Vinho',
    category: 'vestidos',
    categoryLabel: 'Vestidos',
    description: 'Vestido midi em tule floral vinho. Do P ao G1.',
    longDescription: 'Vestido midi em tule com estampa floral em tons de vinho. Manga longa com botões frontais e saia rodada plissada. Disponível do P ao G1 (P, M, G, GG e G1).',
    price: 105,
    oldPrice: 139.90,
    images: ['/products/real/produto-07.jpg', '/products/real/produto-90.jpg', '/products/real/produto-91.jpg', '/products/real/produto-92.jpg'],
    sizes: sizesPG1,
    isNew: true,
  },
  {
    id: 'vestido-tule-poa',
    name: 'Vestido Tule Poá',
    category: 'vestidos',
    categoryLabel: 'Vestidos',
    description: 'Vestido midi em tule verde com poá. Do P ao G.',
    longDescription: 'Vestido midi em tule verde escuro com poá, manga bufante e babado em camadas. Elegante e sofisticado para eventos especiais. Disponível do P ao G.',
    price: 80,
    oldPrice: 109.90,
    images: ['/products/real/produto-08.jpg', '/products/real/produto-93.jpg'],
    sizes: sizesPG,
  },
  {
    id: 'vestido-lese-miriam-vinho',
    name: 'Vestido Midi Lese Miriam',
    category: 'vestidos',
    categoryLabel: 'Vestidos',
    description: 'Vestido Midi Lese Miriam em vinho e rose. Do P ao G1.',
    longDescription: 'Vestido Midi em lese bordado disponível nas cores vinho e rose. Manga e decote elegantes. Disponível do P ao G1.',
    price: 80,
    oldPrice: 109.90,
    images: ['/products/real/produto-81.jpg', '/products/real/produto-96.jpg', '/products/real/produto-97.jpg', '/products/real/produto-98.jpg', '/products/real/produto-99.jpg'],
    sizes: sizesPG1,
    isNew: true,
    colors: [
      { label: 'Vinho', hex: '#6B2737', imageIndex: 0 },
      { label: 'Rosa', hex: '#E8A0B0', imageIndex: 1 },
    ],
  },
  {
    id: 'vestido-lese-malu',
    name: 'Vestido Midi Lese Malu',
    category: 'vestidos',
    categoryLabel: 'Vestidos',
    description: 'Vestido Midi Lese Malu em rosa e azul. Do P ao G1.',
    longDescription: 'Vestido Midi em lese disponível nas cores rosa e azul. Modelagem elegante e feminina. Disponível do P ao G1.',
    price: 80,
    oldPrice: 109.90,
    images: ['/products/real/produto-69.jpg', '/products/real/produto-100.jpg', '/products/real/produto-101.jpg'],
    sizes: sizesPG1,
    isNew: true,
    colors: [
      { label: 'Rosa', hex: '#E8A0B0', imageIndex: 0 },
      { label: 'Azul', hex: '#1B3A5C', imageIndex: 2 },
    ],
  },
  {
    id: 'vestido-cristal-marsala',
    name: 'Vestido Cristal',
    category: 'vestidos',
    categoryLabel: 'Vestidos',
    description: 'Vestido Cristal marsala. Do P ao G1.',
    longDescription: 'Vestido Cristal em marsala com manga longa e botões frontais. Saia plissada com movimento elegante. Disponível do P ao G1.',
    price: 105,
    oldPrice: 139.90,
    images: ['/products/real/produto-09.jpg'],
    sizes: sizesPG1,
    isNew: true,
  },
  {
    id: 'vestido-tule-safira',
    name: 'Vestido Tule Safira',
    category: 'vestidos',
    categoryLabel: 'Vestidos',
    description: 'Vestido Tule Safira. Do P ao EXG.',
    longDescription: 'Vestido em tule Safira com acabamento sofisticado. Disponível do P ao EXG (P, M, G, GG, G1 e EXG). Ideal para festas e eventos especiais.',
    price: 120,
    oldPrice: 159.90,
    images: ['/products/real/produto-39.jpg', '/products/real/produto-118.jpg', '/products/real/produto-119.jpg', '/products/real/produto-120.jpg', '/products/real/produto-121.jpg'],
    sizes: sizesPEXG,
    colors: [
      { label: 'Rosa', hex: '#E8A0B0', imageIndex: 0 },
      { label: 'Azul Marinho', hex: '#0D1B3E', imageIndex: 3 },
    ],
  },
  {
    id: 'vestido-algodao-3-marias',
    name: 'Vestido Midi Algodão 3 Marias',
    category: 'vestidos',
    categoryLabel: 'Vestidos',
    description: 'Vestido Midi Algodão 3 Marias. Variação em vinho.',
    longDescription: 'Vestido Midi em algodão estilo 3 Marias. Disponível com variação na cor vinho. Confortável e elegante para o dia a dia.',
    price: 65,
    oldPrice: 84.90,
    images: ['/products/real/produto-41.jpg', '/products/real/produto-42.jpg', '/products/real/produto-102.jpg', '/products/real/produto-103.jpg'],
    sizes: allSizes,
    isNew: true,
    colors: [
      { label: 'Azul', hex: '#1B3A5C', imageIndex: 0 },
      { label: 'Vinho', hex: '#6B2737', imageIndex: 1 },
    ],
  },
  {
    id: 'vestido-algodao-floral',
    name: 'Vestido Algodão',
    category: 'vestidos',
    categoryLabel: 'Vestidos',
    description: 'Vestido Algodão preto com estampa. Do P ao GG.',
    longDescription: 'Vestido em algodão preto com estampa frontal. Modelagem midi com godê. Disponível do P ao GG.',
    price: 65,
    oldPrice: 84.90,
    images: ['/products/real/produto-43.jpg', '/products/real/produto-130.jpg', '/products/real/produto-131.jpg'],
    sizes: allSizes,
  },
  {
    id: 'vestido-ester-floral',
    name: 'Vestido Ester',
    category: 'vestidos',
    categoryLabel: 'Vestidos',
    description: 'Vestido Ester. Do P ao G.',
    longDescription: 'Vestido Ester com modelagem elegante e feminina. Disponível do P ao G. Perfeito para diversas ocasiões.',
    price: 95,
    oldPrice: 124.90,
    images: ['/products/real/produto-45.jpg', '/products/real/produto-112.jpg', '/products/real/produto-113.jpg'],
    sizes: sizesPG,
    isNew: true,
  },
  {
    id: 'vestido-lese-miriam-rose',
    name: 'Vestido Midi Lese Miriam',
    category: 'vestidos',
    categoryLabel: 'Vestidos',
    description: 'Vestido Midi Lese Miriam. Variação em rose. Do P ao G1.',
    longDescription: 'Vestido Midi em lese com variação na cor rose. Modelagem sofisticada com manga e acabamentos delicados. Disponível do P ao G1.',
    price: 80,
    oldPrice: 109.90,
    images: ['/products/real/produto-47.jpg', '/products/real/produto-48.jpg'],
    sizes: sizesPG1,
    colors: [
      { label: 'Vermelho', hex: '#B22222', imageIndex: 0 },
      { label: 'Rosa', hex: '#E8A0B0', imageIndex: 1 },
    ],
  },
  {
    id: 'vestido-lese-rute',
    name: 'Vestido Midi Lese Rute',
    category: 'vestidos',
    categoryLabel: 'Vestidos',
    description: 'Vestido Midi Lese Rute. Do P ao G1. Versão marinho disponível.',
    longDescription: 'Vestido Midi em lese com elegância e sofisticação. Disponível do P ao G1. Versão marinho disponível do P ao GG.',
    price: 80,
    oldPrice: 109.90,
    images: ['/products/real/produto-50.jpg', '/products/real/produto-51.jpg', '/products/real/produto-104.jpg', '/products/real/produto-105.jpg', '/products/real/produto-106.jpg'],
    sizes: sizesPG1,
    isNew: true,
    colors: [
      { label: 'Azul Claro', hex: '#7BA7C2', imageIndex: 0 },
      { label: 'Azul Escuro', hex: '#0D1B3E', imageIndex: 1 },
    ],
  },
  {
    id: 'vestido-miriam-3x4',
    name: 'Vestido Miriam 3/4',
    category: 'vestidos',
    categoryLabel: 'Vestidos',
    description: 'Vestido Miriam manga 3/4. Do P ao G.',
    longDescription: 'Vestido Miriam com manga 3/4 em tecido de qualidade. Modelagem elegante e confortável. Disponível do P ao G.',
    price: 95,
    oldPrice: 124.90,
    images: ['/products/real/produto-52.jpg', '/products/real/produto-116.jpg', '/products/real/produto-117.jpg'],
    sizes: sizesPG,
  },
  {
    id: 'vestido-algodao-preto',
    name: 'Vestido Algodão',
    category: 'vestidos',
    categoryLabel: 'Vestidos',
    description: 'Vestido Algodão clássico. Do P ao GG.',
    longDescription: 'Vestido em algodão com corte clássico e atemporal. Disponível do P ao GG. Versátil e confortável para o uso diário.',
    price: 55,
    oldPrice: 74.90,
    images: ['/products/real/produto-54.jpg'],
    sizes: allSizes,
    isNew: true,
  },
  {
    id: 'vestido-floral-pastel',
    name: 'Vestido Floral Pastel',
    category: 'vestidos',
    categoryLabel: 'Vestidos',
    description: 'Vestido floral pastel. Preço a confirmar.',
    longDescription: 'Vestido com estampa floral em tons pastéis. Modelagem leve e feminina. Preço em atualização.',
    price: 0,
    images: ['/products/real/produto-56.jpg'],
    sizes: allSizes,
    pendingPrice: true,
  },
  {
    id: 'vestido-algodao-aplicacao',
    name: 'Vestido Midi Algodão Aplicação',
    category: 'vestidos',
    categoryLabel: 'Vestidos',
    description: 'Vestido Midi Algodão com aplicação. Do P ao GG.',
    longDescription: 'Vestido Midi em algodão com detalhes de aplicação. Elegante e confortável. Disponível do P ao GG.',
    price: 65,
    oldPrice: 84.90,
    images: ['/products/real/produto-58.jpg'],
    sizes: allSizes,
  },
  {
    id: 'vestido-ester-cotton',
    name: 'Vestido Ester',
    category: 'vestidos',
    categoryLabel: 'Vestidos',
    description: 'Vestido Ester em cotton. Do P ao G.',
    longDescription: 'Vestido Ester em cotton leve e refrescante. Disponível do P ao G. Perfeito para o dia a dia com estilo.',
    price: 95,
    oldPrice: 124.90,
    images: ['/products/real/produto-60.jpg', '/products/real/produto-114.jpg', '/products/real/produto-115.jpg'],
    sizes: sizesPG,
    isNew: true,
  },
  {
    id: 'vestido-cristal-gode',
    name: 'Vestido Cristal',
    category: 'vestidos',
    categoryLabel: 'Vestidos',
    description: 'Vestido Cristal godê. Do P ao G1.',
    longDescription: 'Vestido Cristal com saia godê que cria movimento ao caminhar. Elegante e sofisticado. Disponível do P ao G1.',
    price: 105,
    oldPrice: 139.90,
    images: ['/products/real/produto-68.jpg', '/products/real/produto-124.jpg', '/products/real/produto-125.jpg'],
    sizes: sizesPG1,
  },
  {
    id: 'vestido-tule-perola',
    name: 'Vestido Tule Pérola',
    category: 'vestidos',
    categoryLabel: 'Vestidos',
    description: 'Vestido Tule Pérola. Do P ao EXG.',
    longDescription: 'Vestido em tule Pérola com acabamentos sofisticados. Disponível do P ao EXG (P, M, G, GG, G1 e EXG). Para eventos e ocasiões especiais.',
    price: 110,
    oldPrice: 144.90,
    images: ['/products/real/produto-78.jpg'],
    sizes: sizesPEXG,
  },

  // ── SAIAS ──────────────────────────────────────────────────────────────────

  {
    id: 'saia-midi-tule-gode',
    name: 'Saia Midi Tule Godê',
    category: 'saias',
    categoryLabel: 'Saias',
    description: 'Saia Midi Tule Godê. Preto e rosa (P ao 66), rose (P ao GG).',
    longDescription: 'Saia Midi em tule godê com volume e movimento. Disponível em preto e rosa do P ao 66, e rose do P ao GG. Cintura elástica confortável.',
    price: 45,
    oldPrice: 59.90,
    images: ['/products/real/produto-49.jpg', '/products/real/produto-126.jpg', '/products/real/produto-127.jpg'],
    sizes: sizesP66,
    isNew: true,
    colors: [
      { label: 'Preto', hex: '#1A1A1A', imageIndex: 0 },
      { label: 'Rosa', hex: '#E8A0B0', imageIndex: 2 },
    ],
  },
  {
    id: 'saia-jeans-1',
    name: 'Saia Jeans',
    category: 'saias',
    categoryLabel: 'Saias',
    description: 'Saia Jeans. Preço a confirmar.',
    longDescription: 'Saia em jeans com modelagem midi. Versátil para diversas ocasiões. Preço em atualização.',
    price: 0,
    images: ['/products/real/produto-11.jpg'],
    sizes: allSizes,
    pendingPrice: true,
  },
  {
    id: 'saia-jeans-2',
    name: 'Saia Jeans',
    category: 'saias',
    categoryLabel: 'Saias',
    description: 'Saia Jeans. Preço a confirmar.',
    longDescription: 'Saia em jeans com modelagem midi. Versátil para diversas ocasiões. Preço em atualização.',
    price: 0,
    images: ['/products/real/produto-14.jpg'],
    sizes: allSizes,
    pendingPrice: true,
  },
  {
    id: 'saia-lese',
    name: 'Saia de Lese',
    category: 'saias',
    categoryLabel: 'Saias',
    description: 'Saia de Lese preta. Do P ao GG.',
    longDescription: 'Saia midi em lese preta com babado na barra. Cintura elástica confortável. Uma peça versátil que eleva qualquer look com sofisticação. Disponível do P ao GG.',
    price: 55,
    oldPrice: 74.90,
    images: ['/products/real/produto-82.jpg', '/products/real/produto-128.jpg', '/products/real/produto-129.jpg'],
    sizes: allSizes,
    isNew: true,
  },

  // ── CALÇAS ─────────────────────────────────────────────────────────────────

  {
    id: 'calca-jeans-1',
    name: 'Calça Jeans',
    category: 'calcas',
    categoryLabel: 'Calças',
    description: 'Calça Jeans. Preço a confirmar.',
    longDescription: 'Calça jeans com corte moderno e modelagem que valoriza a silhueta. Preço em atualização.',
    price: 0,
    images: ['/products/real/produto-16.jpg'],
    sizes: allSizes,
    pendingPrice: true,
  },
  {
    id: 'calca-estampada',
    name: 'Calça',
    category: 'calcas',
    categoryLabel: 'Calças',
    description: 'Calça estampada. Preço a confirmar.',
    longDescription: 'Calça com estampa vibrante. Estilosa e confortável para o dia a dia. Preço em atualização.',
    price: 0,
    images: ['/products/real/produto-20.jpg'],
    sizes: allSizes,
    pendingPrice: true,
  },
  {
    id: 'calca-preta',
    name: 'Calça Preta',
    category: 'calcas',
    categoryLabel: 'Calças',
    description: 'Calça Preta. Preço a confirmar.',
    longDescription: 'Calça preta versátil e elegante. Disponível em tecido de qualidade. Preço em atualização.',
    price: 0,
    images: ['/products/real/produto-22.jpg'],
    sizes: allSizes,
    pendingPrice: true,
    isNew: true,
  },
  {
    id: 'calca-jeans-2',
    name: 'Calça Jeans',
    category: 'calcas',
    categoryLabel: 'Calças',
    description: 'Calça Jeans. Preço a confirmar.',
    longDescription: 'Calça jeans com corte moderno e confortável. Preço em atualização.',
    price: 0,
    images: ['/products/real/produto-24.jpg'],
    sizes: allSizes,
    pendingPrice: true,
  },
  {
    id: 'calca-jeans-3',
    name: 'Calça Jeans',
    category: 'calcas',
    categoryLabel: 'Calças',
    description: 'Calça Jeans. Preço a confirmar.',
    longDescription: 'Calça jeans com corte moderno. Preço em atualização.',
    price: 0,
    images: ['/products/real/produto-27.jpg'],
    sizes: allSizes,
    pendingPrice: true,
  },
  {
    id: 'calca-jeans-4',
    name: 'Calça Jeans',
    category: 'calcas',
    categoryLabel: 'Calças',
    description: 'Calça Jeans. Preço a confirmar.',
    longDescription: 'Calça jeans versátil e estilosa. Preço em atualização.',
    price: 0,
    images: ['/products/real/produto-31.jpg'],
    sizes: allSizes,
    pendingPrice: true,
  },
  {
    id: 'calca-jeans-5',
    name: 'Calça Jeans',
    category: 'calcas',
    categoryLabel: 'Calças',
    description: 'Calça Jeans. Preço a confirmar.',
    longDescription: 'Calça jeans de qualidade. Preço em atualização.',
    price: 0,
    images: ['/products/real/produto-33.jpg'],
    sizes: allSizes,
    pendingPrice: true,
  },
  {
    id: 'calca-jeans-7',
    name: 'Calça Jeans',
    category: 'calcas',
    categoryLabel: 'Calças',
    description: 'Calça Jeans. Preço a confirmar.',
    longDescription: 'Calça jeans versátil. Preço em atualização.',
    price: 0,
    images: ['/products/real/produto-35.jpg'],
    sizes: allSizes,
    pendingPrice: true,
  },
  {
    id: 'calca-jeans-8',
    name: 'Calça Jeans',
    category: 'calcas',
    categoryLabel: 'Calças',
    description: 'Calça Jeans. Preço a confirmar.',
    longDescription: 'Calça jeans de alta qualidade. Preço em atualização.',
    price: 0,
    images: ['/products/real/produto-37.jpg'],
    sizes: allSizes,
    pendingPrice: true,
  },
  {
    id: 'calca-preta-territorial',
    name: 'Calça Preta Territorial',
    category: 'calcas',
    categoryLabel: 'Calças',
    description: 'Calça Preta Territorial. Preço a confirmar.',
    longDescription: 'Calça preta da linha Territorial. Jeans de alta qualidade com corte reto. Preço em atualização.',
    price: 0,
    images: ['/products/real/produto-13.jpg'],
    sizes: allSizes,
    pendingPrice: true,
  },
  {
    id: 'calca-jeans-azul-territorial',
    name: 'Calça Jeans Azul Territorial',
    category: 'calcas',
    categoryLabel: 'Calças',
    description: 'Calça Jeans Azul Territorial. Preço a confirmar.',
    longDescription: 'Calça jeans azul da linha Territorial com detalhes exclusivos. Preço em atualização.',
    price: 0,
    images: ['/products/real/produto-02.jpg'],
    sizes: allSizes,
    pendingPrice: true,
  },

  // ── BERMUDAS ───────────────────────────────────────────────────────────────

  {
    id: 'bermuda-jeans-1',
    name: 'Bermuda Jeans',
    category: 'bermudas',
    categoryLabel: 'Bermudas',
    description: 'Bermuda Jeans. Preço a confirmar.',
    longDescription: 'Bermuda jeans com modelagem confortável e estilosa. Preço em atualização.',
    price: 0,
    images: ['/products/real/produto-18.jpg'],
    sizes: allSizes,
    pendingPrice: true,
  },
  {
    id: 'bermuda-jeans-2',
    name: 'Bermuda Jeans',
    category: 'bermudas',
    categoryLabel: 'Bermudas',
    description: 'Bermuda Jeans. Preço a confirmar.',
    longDescription: 'Bermuda jeans versátil para o dia a dia. Preço em atualização.',
    price: 0,
    images: ['/products/real/produto-29.jpg'],
    sizes: allSizes,
    pendingPrice: true,
  },

  // ── TERRITORIAL ────────────────────────────────────────────────────────────

  {
    id: 'macacao-short-jeans-territorial',
    name: 'Macacão Short Jeans Territorial',
    category: 'territorial',
    categoryLabel: 'Marca Territorial',
    description: 'Macacão Short Jeans Territorial. Preço a confirmar.',
    longDescription: 'Macacão short em jeans da linha Territorial. Disponível em tamanho único.',
    price: 0,
    images: ['/products/real/produto-80.jpg'],
    sizes: allSizes,
    pendingPrice: true,
  },
]

// ── helpers ───────────────────────────────────────────────────────────────────

export function formatPrice(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function getProduct(id: string) {
  return products.find((p) => p.id === id) ?? null
}

export function getRelated(product: Product, limit = 4) {
  return products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, limit)
}
