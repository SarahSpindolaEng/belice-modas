'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ZoomIn, ShoppingBag, Check } from 'lucide-react'
import { type Product, type Size, formatPrice } from '@/lib/products'
import { useCart } from '@/components/cart-context'
import { ImageZoom } from '@/components/image-zoom'
import { cn } from '@/lib/utils'

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, toggleFavorite, isFavorite } = useCart()
  const [size, setSize] = useState<Size | null>(null)
  const [zoomOpen, setZoomOpen] = useState(false)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState(false)
  const fav = isFavorite(product.id)
  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : 0

  function handleAdd() {
    if (!size) {
      setError(true)
      return
    }
    addToCart(product, size)
    setAdded(true)
    setTimeout(() => setAdded(false), 1600)
  }

  return (
    <div className="group flex flex-col min-w-0 w-full">
      <div className="relative overflow-hidden bg-secondary aspect-[3/4]">
        <Link href={`/produto/${product.id}`} aria-label={product.name}>
          <Image
            src={product.images[0] || '/placeholder.svg'}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
          />
        </Link>

        {/* badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-2">
          {product.isNew && (
            <span className="bg-gold-gradient px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-gold-foreground">
              Novo
            </span>
          )}
          {discount > 0 && (
            <span className="bg-foreground px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-background">
              {discount}% OFF
            </span>
          )}
        </div>

        {/* action buttons */}
        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => toggleFavorite(product)}
            aria-label={fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition-colors hover:text-gold"
          >
            <Heart className={cn('h-4 w-4', fav && 'fill-gold text-gold')} />
          </button>
          <button
            type="button"
            onClick={() => setZoomOpen(true)}
            aria-label="Ampliar imagem"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur opacity-0 transition-opacity group-hover:opacity-100 hover:text-gold"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* details */}
      <div className="flex flex-1 flex-col pt-4">
        <p className="text-[11px] uppercase tracking-widest text-gold-dark">
          {product.categoryLabel}
        </p>
        <Link href={`/produto/${product.id}`}>
          <h3 className="mt-1 font-serif text-xl leading-tight text-foreground hover:text-gold-dark transition-colors text-balance">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 text-sm font-light text-muted-foreground line-clamp-2 min-h-[2.75rem]">
          {product.description}
        </p>

        <div className="mt-2 flex items-baseline gap-2">
          {product.pendingPrice ? (
            <span className="text-sm font-light text-gold-dark italic">
              Preço a confirmar
            </span>
          ) : (
            <>
              <span className="text-lg font-medium text-foreground">
                {formatPrice(product.price)}
              </span>
              {product.oldPrice && (
                <span className="text-sm font-light text-muted-foreground line-through">
                  {formatPrice(product.oldPrice)}
                </span>
              )}
            </>
          )}
        </div>

        {/* size selector */}
        <div className="mt-auto pt-3">
          <div className="flex items-center gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSize(s)
                  setError(false)
                }}
                className={cn(
                  'h-8 w-8 border text-xs font-light transition-colors',
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
            <p className="mt-1.5 text-xs text-destructive">
              Selecione um tamanho.
            </p>
          )}
        </div>

        {/* add to cart */}
        <button
          type="button"
          onClick={handleAdd}
          className={cn(
            'mt-4 flex items-center justify-center gap-2 border px-4 py-3 text-xs uppercase tracking-widest transition-all',
            added
              ? 'border-gold bg-gold-gradient text-gold-foreground'
              : 'border-foreground bg-foreground text-background hover:bg-gold-gradient hover:border-gold hover:text-gold-foreground',
          )}
        >
          {added ? (
            <>
              <Check className="h-4 w-4" /> Adicionado
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" /> Adicionar
            </>
          )}
        </button>
      </div>

      {zoomOpen && (
        <ImageZoom
          images={product.images}
          alt={product.name}
          onClose={() => setZoomOpen(false)}
        />
      )}
    </div>
  )
}
