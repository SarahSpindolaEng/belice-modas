import Link from 'next/link'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PageBanner } from '@/components/page-banner'
import { Package } from 'lucide-react'

export default function OrdersPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <PageBanner
          title="Meus Pedidos"
          subtitle="Acompanhe o status e o rastreamento das suas compras."
          breadcrumb={[{ label: 'Inicio', href: '/inicio' }, { label: 'Meus Pedidos' }]}
        />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-14">
          <div className="py-16 text-center">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 font-serif text-2xl text-foreground">
              Voce ainda nao fez pedidos
            </p>
            <Link
              href="/produtos"
              className="mt-6 inline-block bg-foreground px-8 py-4 text-xs uppercase tracking-widest text-background transition-colors hover:bg-gold-gradient hover:text-gold-foreground"
            >
              Comecar a comprar
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
