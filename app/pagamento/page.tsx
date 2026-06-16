'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PageBanner } from '@/components/page-banner'
import { useCart } from '@/components/cart-context'
import { formatPrice } from '@/lib/products'
import { QrCode, CreditCard, Landmark, Barcode, ShieldCheck, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

type Method = 'pix' | 'credito' | 'debito' | 'boleto'

const methods: { id: Method; label: string; icon: typeof QrCode; note: string }[] = [
  { id: 'pix', label: 'Pix', icon: QrCode, note: '5% de desconto à vista' },
  { id: 'credito', label: 'Cartão de Crédito', icon: CreditCard, note: 'Parcele em até 6x sem juros' },
  { id: 'debito', label: 'Cartão de Débito', icon: Landmark, note: 'Aprovação imediata' },
  { id: 'boleto', label: 'Boleto Bancário', icon: Barcode, note: 'Vence em 3 dias úteis' },
]

export default function PaymentPage() {
  const { subtotal } = useCart()
  const [method, setMethod] = useState<Method>('pix')

  const pixTotal = subtotal * 0.95

  return (
    <>
      <SiteHeader />
      <main>
        <PageBanner
          title="Pagamento"
          breadcrumb={[
            { label: 'Início', href: '/' },
            { label: 'Checkout', href: '/checkout' },
            { label: 'Pagamento' },
          ]}
        />
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
            <div>
              <h2 className="font-serif text-2xl text-foreground">
                Escolha a forma de pagamento
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {methods.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={cn(
                      'flex items-start gap-3 border p-4 text-left transition-colors',
                      method === m.id
                        ? 'border-gold bg-accent/50'
                        : 'border-border hover:border-gold',
                    )}
                  >
                    <m.icon className="h-6 w-6 shrink-0 text-gold-dark" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{m.label}</p>
                      <p className="text-xs font-light text-muted-foreground">{m.note}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* method details */}
              <div className="mt-6 border border-border p-6">
                {method === 'pix' && (
                  <div className="text-center">
                    <div className="mx-auto flex h-40 w-40 items-center justify-center border border-border bg-secondary">
                      <QrCode className="h-24 w-24 text-foreground/30" />
                    </div>
                    <p className="mt-4 text-sm font-light text-muted-foreground">
                      Escaneie o QR Code com o app do seu banco
                    </p>
                    <p className="mt-2 text-lg font-medium text-foreground">
                      {formatPrice(pixTotal)}{' '}
                      <span className="text-sm font-light text-gold-dark">à vista no Pix</span>
                    </p>
                  </div>
                )}
                {(method === 'credito' || method === 'debito') && (
                  <form className="grid gap-4 sm:grid-cols-2">
                    <Field label="Número do cartão" className="sm:col-span-2" placeholder="0000 0000 0000 0000" />
                    <Field label="Nome no cartão" className="sm:col-span-2" placeholder="Como impresso no cartão" />
                    <Field label="Validade" placeholder="MM/AA" />
                    <Field label="CVV" placeholder="000" />
                    {method === 'credito' && (
                      <div className="sm:col-span-2">
                        <label className="text-xs uppercase tracking-widest text-foreground">
                          Parcelamento
                        </label>
                        <select className="mt-2 w-full border border-border bg-background px-4 py-3 text-sm font-light focus:border-gold focus:outline-none">
                          {[1, 2, 3, 4, 5, 6].map((n) => (
                            <option key={n} value={n}>
                              {n}x de {formatPrice(subtotal / n)} sem juros
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </form>
                )}
                {method === 'boleto' && (
                  <div className="text-center">
                    <Barcode className="mx-auto h-16 w-32 text-foreground/40" />
                    <p className="mt-4 text-sm font-light text-muted-foreground">
                      O boleto será gerado após a confirmação. O pedido é enviado
                      após a compensação do pagamento.
                    </p>
                    <p className="mt-2 text-lg font-medium text-foreground">
                      {formatPrice(subtotal)}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex items-center gap-2 text-xs font-light text-muted-foreground">
                <Lock className="h-4 w-4 text-gold-dark" />
                Seus dados são protegidos com criptografia SSL de 256 bits.
              </div>
            </div>

            {/* summary */}
            <aside className="h-fit border border-border p-6">
              <h2 className="font-serif text-2xl text-foreground">Resumo</h2>
              <dl className="mt-5 space-y-3 text-sm font-light">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="text-foreground">{formatPrice(subtotal)}</dd>
                </div>
                {method === 'pix' && (
                  <div className="flex justify-between text-gold-dark">
                    <dt>Desconto Pix (5%)</dt>
                    <dd>- {formatPrice(subtotal * 0.05)}</dd>
                  </div>
                )}
              </dl>
              <div className="mt-4 flex justify-between border-t border-border pt-4">
                <span className="text-sm uppercase tracking-widest text-foreground">Total</span>
                <span className="text-xl font-medium text-foreground">
                  {formatPrice(method === 'pix' ? pixTotal : subtotal)}
                </span>
              </div>
              <button
                type="button"
                className="mt-6 flex w-full items-center justify-center gap-2 bg-gold-gradient px-6 py-4 text-xs uppercase tracking-widest text-gold-foreground transition-opacity hover:opacity-90"
              >
                <ShieldCheck className="h-4 w-4" /> Confirmar Pagamento
              </button>
              <Link
                href="/checkout"
                className="mt-3 block text-center text-xs uppercase tracking-widest text-muted-foreground hover:text-gold-dark transition-colors"
              >
                Voltar
              </Link>
            </aside>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}

function Field({
  label,
  placeholder,
  className,
}: {
  label: string
  placeholder?: string
  className?: string
}) {
  return (
    <div className={className}>
      <label className="text-xs uppercase tracking-widest text-foreground">
        {label}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        className="mt-2 w-full border border-border bg-background px-4 py-3 text-sm font-light focus:border-gold focus:outline-none"
      />
    </div>
  )
}
