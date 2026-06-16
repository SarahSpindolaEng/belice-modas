import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PageBanner } from '@/components/page-banner'
import { CatalogGrid } from '@/components/catalog-grid'
import { products } from '@/lib/products'

export default function CatalogPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <PageBanner
          title="Catálogo"
          subtitle="Descubra toda a nossa coleção de moda feminina premium. Vestidos, calças, saias, bermudas e a exclusiva Marca Territorial."
          breadcrumb={[{ label: 'Início', href: '/' }, { label: 'Catálogo' }]}
        />
        <CatalogGrid products={products} />
      </main>
      <SiteFooter />
    </>
  )
}
