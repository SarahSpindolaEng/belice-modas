'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PageBanner } from '@/components/page-banner'
import { FreteCalculator } from '@/components/frete-calculator'
import { useCart } from '@/components/cart-context'
import { formatPrice } from '@/lib/products'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react'

interface FreteOpcao {
  id: number
  nome: string
  transportadora: string
  preco: number
  prazo: number
  logo: string | null
}

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, subtotal } = useCart()
  const [freteOpcao, setFreteOpcao] = useState<FreteOpcao | null>(null)

  function irParaCheckout() {
    if (!freteOpcao) return
    const params = new URLSearchParams({
      frete_nome: freteOpcao.nome,
      frete_transportadora: freteOpcao.transportadora,
      frete_preco: String(freteOpcao.preco),
      frete_prazo: String(freteOpcao.prazo),
    })
    window.location.href = `/checkout?${params.toString()}`
  }

  const frete = freteOpcao?.preco ?? null
  const total = frete !== null ? subtotal + frete : subtotal
  const totalItens = items.reduce((acc, i) => acc + i.quantity, 0)

  return (
    <>
      <SiteHeader />
      <main>
        <PageBanner
          title="Carrinho"
          breadcrumb={[{ label: 'Início', href: '/' }, { label: 'Carrinho' }]}
        />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          {items.length > 0 ? (
            <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
              <div className="divide-y divide-border border-y border-border">
                {items.map((item) => (
                  <div key={`${item.product.id}-${item.size}`} className="flex gap-4 py-6">
                    <Link
                      href={`/produto/${item.product.id}`}
                      className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden bg-secondary"
                    >
                      <Image
                        src={item.image || item.product.images[0] || '/placeholder.svg'}
                        alt={item.product.name}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </Link>
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between gap-3">
                        <div>
                          <Link
                            href={`/produto/${item.product.id}`}
                            className="font-serif text-lg text-foreground hover:text-gold-dark transition-colors"
                          >
                            {item.product.name}
                          </Link>
                          <p className="mt-0.5 text-xs uppercase tracking-widest text-muted-foreground">
                            Tamanho: {item.size}
                          </p>
                          {item.color && (
                            <p className="mt-0.5 flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
                              <span
                                className="inline-block h-3 w-3 rounded-full border border-border"
                                style={{ backgroundColor: item.color.hex }}
                              />
                              {item.color.label}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id, item.size)}
                          aria-label="Remover item"
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-auto flex items-end justify-between pt-4">
                        <div className="flex items-center border border-border">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.size, item.quantity - 1)}
                            className="flex h-9 w-9 items-center justify-center text-foreground hover:text-gold transition-colors"
                            aria-label="Diminuir"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-10 text-center text-sm">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.size, item.quantity + 1)}
                            className="flex h-9 w-9 items-center justify-center text-foreground hover:text-gold transition-colors"
                            aria-label="Aumentar"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-light text-muted-foreground">
                            {formatPrice(item.product.price)} un.
                          </p>
                          <p className="font-medium text-foreground">
                            {formatPrice(item.product.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <aside className="h-fit border border-border p-6">
                <h2 className="font-serif text-2xl text-foreground">Resumo do Pedido</h2>
                <div className="mt-5 h-px w-full bg-border" />
                <dl className="mt-4 space-y-3 text-sm font-light">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Subtotal</dt>
                    <dd className="text-foreground">{formatPrice(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Frete</dt>
                    <dd className="text-foreground">
                      {frete === null ? '--' : frete === 0 ? 'Gratis' : formatPrice(frete)}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 flex justify-between border-t border-border pt-4">
                  <span className="text-sm uppercase tracking-widest text-foreground">Total</span>
                  <span className="text-xl font-medium text-foreground">
                    {frete !== null ? formatPrice(total) : '--'}
                  </span>
                </div>
                {frete !== null && (
                  <p className="mt-1 text-right text-xs font-light text-gold-dark">
                    em ate 6x de {formatPrice(total / 6)}
                  </p>
                )}
                <FreteCalculator
                  quantidade={totalItens}
                  onSelect={setFreteOpcao}
                  selected={freteOpcao}
                />
                <button
                  type="button"
                  onClick={irParaCheckout}
                  disabled={!freteOpcao}
                  className="mt-6 flex w-full items-center justify-center gap-2 bg-foreground px-6 py-4 text-xs uppercase tracking-widest text-background transition-colors hover:bg-gold-gradient hover:text-gold-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Finalizar Compra <ArrowRight className="h-4 w-4" />
                </button>
                {!freteOpcao && (
                  <p className="mt-2 text-center text-xs font-light text-muted-foreground">
                    Calcule o frete para continuar
                  </p>
                )}
                <Link
                  href="/produtos"
                  className="mt-3 block text-center text-xs uppercase tracking-widest text-muted-foreground hover:text-gold-dark transition-colors"
                >
                  Continuar comprando
                </Link>
              </aside>
            </div>
          ) : (
            <div className="flex flex-col items-center py-16 text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 font-serif text-2xl text-foreground">
                Seu carrinho esta vazio
              </p>
              <p className="mt-2 max-w-sm font-light text-muted-foreground">
                Explore nossa colecao e encontre pecas que combinam com voce.
              </p>
              <Link
                href="/produtos"
                className="mt-6 bg-foreground px-8 py-4 text-xs uppercase tracking-widest text-background transition-colors hover:bg-gold-gradient hover:text-gold-foreground"
              >
                Ver produtos
              </Link>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
