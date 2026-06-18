import { notFound } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PageBanner } from '@/components/page-banner'
import { CatalogGrid } from '@/components/catalog-grid'
import { products, categories, territorialSubs, type Category } from '@/lib/products'

const subtitles: Record<Category, string> = {
  vestidos: 'Vestidos elegantes para todas as ocasiões, do casual ao sofisticado.',
  calcas: 'Calças de alfaiataria, pantalonas e modelagens que valorizam a silhueta.',
  saias: 'Saias midi, mini e plissadas com caimento impecável.',
  bermudas: 'Bermudas alfaiatadas e jeans para looks leves e estilosos.',
  territorial: 'A linha exclusiva Marca Territorial: peças statement e autênticas.',
}

export function generateStaticParams() {
  return categories.map((c) => ({ categoria: c.slug }))
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ categoria: string }>
}) {
  const { categoria } = await params
  const cat = categories.find((c) => c.slug === categoria)
  if (!cat) notFound()

  const filtered = products.filter((p) => p.category === cat.slug)

  return (
    <>
      <SiteHeader />
      <main>
        <PageBanner
          title={cat.label}
          subtitle={subtitles[cat.slug]}
          breadcrumb={[
            { label: 'Início', href: '/' },
            { label: 'Produtos', href: '/produtos' },
            { label: cat.label },
          ]}
        />
        <CatalogGrid
          products={filtered}
          showFilters={false}
          subFilters={cat.slug === 'territorial' ? territorialSubs : undefined}
        />
      </main>
      <SiteFooter />
    </>
  )
}
