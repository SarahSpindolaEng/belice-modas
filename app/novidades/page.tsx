import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PageBanner } from '@/components/page-banner'
import { CatalogGrid } from '@/components/catalog-grid'
import { products } from '@/lib/products'

export default function NovidadesPage() {
  const novidades = products.filter((p) => p.isNew)

  return (
    <>
      <SiteHeader />
      <main>
        <PageBanner
          title="Novidades"
          subtitle="As peças mais recentes da Belice Modas. Seja a primeira a vestir as tendências da temporada."
          breadcrumb={[{ label: 'Início', href: '/' }, { label: 'Novidades' }]}
        />
        <CatalogGrid products={novidades} showFilters={false} />
      </main>
      <SiteFooter />
    </>
  )
}
