'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingBag, Trash2 } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PageBanner } from '@/components/page-banner'
import { formatPrice } from '@/lib/products'
import { useCart } from '@/components/cart-context'

export default function FavoritesPage() {
  const { favorites, removeFavorite, addToCart } = useCart()

  return (
    <>
      <SiteHeader />
      <main>
        <PageBanner
          title="Lista de Desejos"
          subtitle="Suas pecas favoritas reunidas em um so lugar."
          breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Favoritos' }]}
        />

        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-14">
          {favorites.length > 0 ? (
            <div className="divide-y divide-border">
              {favorites.map((fav) => (
                <div key={fav.product.id} className="flex gap-5 py-6 sm:gap-8">
                  <Link
                    href={'/produto/' + fav.product.id}
                    className="relative h-32 w-24 shrink-0 overflow-hidden bg-secondary sm:h-40 sm:w-32"
                  >
                    <Image
                      src={fav.image || fav.product.images[0] || '/placeholder.svg'}
                      alt={fav.product.name}
                      fill
                      sizes="(max-width: 640px) 96px, 128px"
                      className="object-cover"
                    />
                  </Link>

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-gold-dark">
                        {fav.product.categoryLabel}
                      </p>
                      <Link href={'/produto/' + fav.product.id}>
                        <h3 className="mt-1 font-serif text-xl text-foreground hover:text-gold-dark transition-colors">
                          {fav.product.name}
                        </h3>
                      </Link>

                      <p className="mt-1 text-lg font-medium text-foreground">
                        {formatPrice(fav.product.price)}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        {fav.size && (
                          <span className="border border-border px-2.5 py-0.5 text-xs uppercase tracking-widest text-foreground">
                            {fav.size}
                          </span>
                        )}
                        {fav.color && (
                          <span className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
                            <span
                              className="inline-block h-3.5 w-3.5 rounded-full border border-border"
                              style={{ backgroundColor: fav.color.hex }}
                            />
                            {fav.color.label}
                          </span>
                        )}
                        {!fav.size && !fav.color && (
                          <span className="text-xs font-light text-muted-foreground">
                            Selecione tamanho e cor na pagina do produto
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {fav.size ? (
                        <button
                          type="button"
                          onClick={() => addToCart(fav.product, fav.size!, 1, fav.color, fav.image)}
                          className="flex items-center gap-2 bg-foreground px-5 py-2.5 text-xs uppercase tracking-widest text-background transition-colors hover:bg-gold-gradient hover:text-gold-foreground"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
                          Adicionar ao Carrinho
                        </button>
                      ) : (
                        <Link
                          href={'/produto/' + fav.product.id}
                          className="flex items-center gap-2 bg-foreground px-5 py-2.5 text-xs uppercase tracking-widest text-background transition-colors hover:bg-gold-gradient hover:text-gold-foreground"
                        >
                          Escolher opcoes
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => removeFavorite(fav.product.id)}
                        aria-label="Remover da lista"
                        className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-16 text-center">
              <Heart className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 font-serif text-2xl text-foreground">
                Sua lista esta vazia
              </p>
              <p className="mt-2 max-w-sm font-light text-muted-foreground">
                Toque no coracao dos produtos que voce ama para salva-los aqui.
              </p>
              <Link
                href="/produtos"
                className="mt-6 bg-foreground px-8 py-4 text-xs uppercase tracking-widest text-background transition-colors hover:bg-gold-gradient hover:text-gold-foreground"
              >
                Explorar produtos
              </Link>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
