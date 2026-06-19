import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Hero } from '@/components/home/hero'
import { PromoBanner, CategoryGrid, SectionTitle } from '@/components/home/sections'
import { ProductCard } from '@/components/product-card'
import { products } from '@/lib/products'
import { ShieldCheck, RefreshCcw, CreditCard } from 'lucide-react'

export default function HomePage() {
  const featured = products.slice(0, 4)
  const novidades = products.filter((p) => p.isNew).slice(0, 4)

  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <PromoBanner />

        {/* benefits */}
        <section className="border-b border-border">
          <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-x-16 gap-y-6 px-4 py-10 sm:px-6">
            {[
              { icon: CreditCard, title: 'Parcele em até 12x', desc: 'No cartão de crédito' },
              { icon: RefreshCcw, title: 'Troca Fácil', desc: 'Até 7 dias' },
              { icon: ShieldCheck, title: 'Compra Segura', desc: 'Ambiente protegido' },
            ].map((b) => (
              <div key={b.title} className="flex items-center gap-3">
                <b.icon className="h-7 w-7 shrink-0 text-gold-dark" />
                <div>
                  <p className="text-sm font-medium text-foreground">{b.title}</p>
                  <p className="text-xs font-light text-muted-foreground">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* featured */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <SectionTitle eyebrow="Seleção Especial" title="Produtos em Destaque" />
          <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              href="/produtos"
              className="inline-block border border-foreground px-10 py-4 text-xs uppercase tracking-widest text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              Ver todo o catálogo
            </Link>
          </div>
        </section>

        <CategoryGrid />

        {/* novidades */}
        <section className="bg-secondary/50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle eyebrow="Recém-chegados" title="Novidades" />
            <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
              {novidades.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
