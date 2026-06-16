'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PageBanner } from '@/components/page-banner'
import { useCart } from '@/components/cart-context'
import { formatPrice } from '@/lib/products'
import { Truck, Store, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSession } from 'next-auth/react'

function CheckoutContent() {
  const { items, subtotal } = useCart()
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [loadingMP, setLoadingMP] = useState(false)
  const [delivery, setDelivery] = useState<'entrega' | 'retirada'>('entrega')

  // Frete vindo do carrinho via URL
  const freteNome = searchParams.get('frete_nome')
  const freteTransportadora = searchParams.get('frete_transportadora')
  const fretePreco = parseFloat(searchParams.get('frete_preco') ?? '0')
  const fretePrazo = searchParams.get('frete_prazo')
  const temFrete = !!freteNome

  const shippingCost = delivery === 'retirada' ? 0 : (temFrete ? fretePreco : 0)
  const total = subtotal + shippingCost

  async function handlePagar() {
    setLoadingMP(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: session?.user?.email ?? undefined,
          items: items.map((i) => ({
            id: i.product.id,
            name: i.product.name,
            quantity: i.quantity,
            price: i.product.price,
            image: i.image ?? i.product.images[0],
            color: i.color?.label,
            size: i.size,
          })),
          frete: delivery === 'retirada' ? null : {
            nome: freteNome,
            preco: fretePreco,
            prazo: fretePrazo,
          },
        }),
      })
      const data = await res.json()
      if (data.init_point) {
        window.location.href = data.init_point
      } else {
        alert('Erro ao iniciar pagamento. Tente novamente.')
        setLoadingMP(false)
      }
    } catch {
      alert('Erro ao iniciar pagamento. Tente novamente.')
      setLoadingMP(false)
    }
  }

  return (
    <main>
      <PageBanner
        title="Finalizar Compra"
        breadcrumb={[
          { label: 'Início', href: '/' },
          { label: 'Carrinho', href: '/carrinho' },
          { label: 'Checkout' },
        ]}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        {items.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-serif text-2xl text-foreground">Não há itens para finalizar</p>
            <Link
              href="/produtos"
              className="mt-6 inline-block bg-foreground px-8 py-4 text-xs uppercase tracking-widest text-background transition-colors hover:bg-gold-gradient hover:text-gold-foreground"
            >
              Ver produtos
            </Link>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
            <div className="space-y-10">
              {/* Método de entrega */}
              <section>
                <h2 className="font-serif text-2xl text-foreground">Entrega</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setDelivery('entrega')}
                    className={cn(
                      'flex items-center gap-3 border p-4 text-left transition-colors',
                      delivery === 'entrega'
                        ? 'border-gold bg-accent/50'
                        : 'border-border hover:border-gold',
                    )}
                  >
                    <Truck className="h-6 w-6 text-gold-dark" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Receber em casa</p>
                      {temFrete && delivery === 'entrega' ? (
                        <p className="text-xs font-light text-muted-foreground">
                          {freteNome} · {freteTransportadora}
                        </p>
                      ) : (
                        <p className="text-xs font-light text-muted-foreground">Entrega pelos Correios</p>
                      )}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDelivery('retirada')}
                    className={cn(
                      'flex items-center gap-3 border p-4 text-left transition-colors',
                      delivery === 'retirada'
                        ? 'border-gold bg-accent/50'
                        : 'border-border hover:border-gold',
                    )}
                  >
                    <Store className="h-6 w-6 text-gold-dark" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Retirar na loja</p>
                      <p className="text-xs font-light text-muted-foreground">Sem custo de frete</p>
                    </div>
                  </button>
                </div>
              </section>

              {/* Detalhe da entrega */}
              {delivery === 'entrega' ? (
                <section>
                  {temFrete ? (
                    <div className="border border-gold bg-accent/30 p-5">
                      <p className="text-sm font-medium text-foreground">Opção selecionada</p>
                      <p className="mt-1 text-lg font-serif text-foreground">
                        {freteNome} — {freteTransportadora}
                      </p>
                      <p className="text-sm font-light text-muted-foreground">
                        Prazo: {fretePrazo} dia{Number(fretePrazo) !== 1 ? 's' : ''} útil{Number(fretePrazo) !== 1 ? 'eis' : ''}
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {fretePreco === 0 ? 'Grátis' : formatPrice(fretePreco)}
                      </p>
                      <Link
                        href="/carrinho"
                        className="mt-3 inline-block text-xs text-gold-dark underline hover:no-underline"
                      >
                        Alterar opção de frete
                      </Link>
                    </div>
                  ) : (
                    <div className="border border-border p-5 text-center">
                      <p className="text-sm text-muted-foreground">
                        Nenhum frete selecionado.{' '}
                        <Link href="/carrinho" className="text-gold-dark underline">
                          Volte ao carrinho
                        </Link>{' '}
                        para calcular.
                      </p>
                    </div>
                  )}
                </section>
              ) : (
                <section>
                  <h2 className="font-serif text-2xl text-foreground">Loja Física</h2>
                  <div className="mt-4 border border-border p-5">
                    <p className="font-medium text-foreground">Belice Modas — Loja Centro</p>
                    <p className="mt-1 text-sm font-light text-muted-foreground">
                      Rua das Flores, 123 — Centro
                    </p>
                    <p className="text-sm font-light text-muted-foreground">
                      Seg a Sex · 9h às 18h · Sáb · 9h às 13h
                    </p>
                    <p className="mt-2 text-xs font-light text-gold-dark">
                      Você receberá um aviso quando seu pedido estiver disponível para retirada.
                    </p>
                  </div>
                </section>
              )}
            </div>

            {/* Resumo */}
            <aside className="h-fit border border-border p-6">
              <h2 className="font-serif text-2xl text-foreground">Seu Pedido</h2>
              <div className="mt-5 space-y-4">
                {items.map((item) => (
                  <div key={`${item.product.id}-${item.size}`} className="flex gap-3">
                    <div className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden bg-secondary">
                      <Image
                        src={item.product.images[0] || '/placeholder.svg'}
                        alt={item.product.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <p className="text-sm font-medium text-foreground leading-tight">
                        {item.product.name}
                      </p>
                      <p className="text-xs font-light text-muted-foreground">
                        Tam {item.size} · Qtd {item.quantity}
                      </p>
                      <p className="mt-auto text-sm text-foreground">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <dl className="mt-5 space-y-3 border-t border-border pt-4 text-sm font-light">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="text-foreground">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Frete</dt>
                  <dd className="text-foreground">
                    {delivery === 'retirada'
                      ? 'Retirada'
                      : temFrete
                        ? fretePreco === 0 ? 'Grátis' : formatPrice(fretePreco)
                        : '—'}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 flex justify-between border-t border-border pt-4">
                <span className="text-sm uppercase tracking-widest text-foreground">Total</span>
                <span className="text-xl font-medium text-foreground">{formatPrice(total)}</span>
              </div>
              <button
                type="button"
                onClick={handlePagar}
                disabled={loadingMP || (delivery === 'entrega' && !temFrete)}
                className="mt-6 flex w-full items-center justify-center gap-2 bg-foreground px-6 py-4 text-xs uppercase tracking-widest text-background transition-colors hover:bg-gold-gradient hover:text-gold-foreground disabled:opacity-60"
              >
                {loadingMP ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Aguarde...</>
                ) : (
                  'Pagar com Mercado Pago'
                )}
              </button>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}

export default function CheckoutPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">Carregando...</div>}>
        <CheckoutContent />
      </Suspense>
      <SiteFooter />
    </>
  )
}
