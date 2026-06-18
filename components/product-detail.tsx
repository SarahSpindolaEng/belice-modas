'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Heart,
  ZoomIn,
  ShoppingBag,
  Check,
  RefreshCcw,
  ShieldCheck,
  Minus,
  Plus,
} from 'lucide-react'
import { type Product, type Size, type ColorOption, formatPrice } from '@/lib/products'
import { useCart } from '@/components/cart-context'
import { ImageZoom } from '@/components/image-zoom'
import { cn } from '@/lib/utils'

export function ProductDetail({ product }: { product: Product }) {
  const { addToCart, toggleFavorite, isFavorite } = useCart()
  const router = useRouter()

  function handleVoltar() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/produtos')
    }
  }
  const [activeImg, setActiveImg] = useState(0)
  const [activeColor, setActiveColor] = useState<ColorOption | null>(product.colors?.[0] ?? null)
  const [size, setSize] = useState<Size | null>(null)
  const [qty, setQty] = useState(1)
  const [zoomOpen, setZoomOpen] = useState(false)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState(false)
  const fav = isFavorite(product.id)
  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0
  // Se a cor selecionada define tamanhos proprios, usa eles; senao usa os do produto.
  const sizesDisponiveis = activeColor?.sizes ?? product.sizes

  function handleAdd() {
    if (!size) {
      setError(true)
      return
    }
    addToCart(product, size, qty, activeColor ?? undefined, product.images[activeImg])
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <button
        type="button"
        onClick={handleVoltar}
        className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-gold-dark"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar ao catálogo
      </button>
      <div className="grid gap-10 lg:grid-cols-2">
        {/* gallery */}
        <div>
          <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
            <Image
              src={product.images[activeImg] || '/placeholder.svg'}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-top"
            />
            {discount > 0 && (
              <span className="absolute left-4 top-4 bg-foreground px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-background">
                {discount}% OFF
              </span>
            )}
            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              aria-label="Ampliar imagem"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur hover:text-gold transition-colors"
            >
              <ZoomIn className="h-5 w-5" />
            </button>
          </div>
          {product.images.length > 1 && (
            <div className="mt-4 flex gap-3">
              {product.images.map((img, i) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setActiveImg(i)}
                  className={cn(
                    'relative aspect-[3/4] w-20 overflow-hidden border bg-secondary',
                    activeImg === i ? 'border-gold' : 'border-border',
                  )}
                  aria-label={`Imagem ${i + 1}`}
                >
                  <Image src={img} alt="" fill sizes="80px" className="object-cover object-top" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* info */}
        <div className="flex flex-col">
          <p className="text-xs uppercase tracking-[0.25em] text-gold-dark">
            {product.categoryLabel}
          </p>
          <h1 className="mt-2 font-serif text-4xl text-foreground sm:text-5xl text-balance">
            {product.name}
          </h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-medium text-foreground">
              {formatPrice(product.price)}
            </span>
            {product.oldPrice && (
              <span className="text-lg font-light text-muted-foreground line-through">
                {formatPrice(product.oldPrice)}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-light text-gold-dark">
            ou 6x de {formatPrice(product.price / 6)} sem juros
          </p>

          <p className="mt-6 font-light leading-relaxed text-foreground/80">
            {product.longDescription}
          </p>

          {/* colors */}
          {product.colors && product.colors.length > 0 && (
            <div className="mt-8">
              <p className="text-xs uppercase tracking-widest text-foreground">
                Cor &mdash; <span className="normal-case font-light text-muted-foreground">{activeColor?.label}</span>
              </p>
              <div className="mt-3 flex gap-3">
                {product.colors.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    title={c.label}
                    onClick={() => {
                      setActiveColor(c)
                      setActiveImg(c.imageIndex)
                      setSize(null)
                      setError(false)
                    }}
                    className={cn(
                      'h-9 w-9 rounded-full border-2 transition-all',
                      activeColor?.label === c.label
                        ? 'border-foreground scale-110'
                        : 'border-transparent hover:border-foreground/40',
                    )}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* sizes */}
          <div className="mt-8">
            <p className="text-xs uppercase tracking-widest text-foreground">
              Tamanho
            </p>
            <div className="mt-3 flex gap-3">
              {sizesDisponiveis.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSize(s)
                    setError(false)
                  }}
                  className={cn(
                    'h-11 w-11 border text-sm font-light transition-colors',
                    size === s
                      ? 'border-gold bg-gold-gradient text-gold-foreground'
                      : 'border-border bg-background text-foreground hover:border-gold',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            {error && (
              <p className="mt-2 text-xs text-destructive">
                Selecione um tamanho para continuar.
              </p>
            )}
          </div>

          {/* quantity */}
          <div className="mt-6">
            <p className="text-xs uppercase tracking-widest text-foreground">
              Quantidade
            </p>
            <div className="mt-3 flex w-fit items-center border border-border">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="flex h-11 w-11 items-center justify-center text-foreground hover:text-gold transition-colors"
                aria-label="Diminuir"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center text-sm">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="flex h-11 w-11 items-center justify-center text-foreground hover:text-gold transition-colors"
                aria-label="Aumentar"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* actions */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleAdd}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 px-6 py-4 text-xs uppercase tracking-widest transition-all',
                added
                  ? 'bg-gold-gradient text-gold-foreground'
                  : 'bg-foreground text-background hover:bg-gold-gradient hover:text-gold-foreground',
              )}
            >
              {added ? (
                <>
                  <Check className="h-4 w-4" /> Adicionado ao carrinho
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" /> Adicionar ao Carrinho
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() =>
                toggleFavorite(
                  product,
                  size ?? undefined,
                  activeColor ?? undefined,
                  product.images[activeImg],
                )
              }
              className="flex items-center justify-center gap-2 border border-foreground px-6 py-4 text-xs uppercase tracking-widest text-foreground transition-colors hover:border-gold hover:text-gold-dark"
            >
              <Heart className={cn('h-4 w-4', fav && 'fill-gold text-gold')} />
              {fav ? 'Salvo' : 'Lista de Desejos'}
            </button>
          </div>

          {/* benefits */}
          <div className="mt-8 grid gap-4 border-t border-border pt-6 sm:grid-cols-3">
            {[
              { icon: RefreshCcw, label: 'Troca facil em ate 30 dias' },
              { icon: ShieldCheck, label: 'Pagamento 100% seguro' },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2">
                <b.icon className="h-5 w-5 shrink-0 text-gold-dark" />
                <span className="text-xs font-light text-muted-foreground">
                  {b.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {zoomOpen && (
        <ImageZoom
          images={product.images}
          alt={product.name}
          startIndex={activeImg}
          onClose={() => setZoomOpen(false)}
        />
      )}
    </div>
  )
}
