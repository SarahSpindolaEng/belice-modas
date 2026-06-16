import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { ProductDetail } from '@/components/product-detail'
import { ProductCard } from '@/components/product-card'
import { SectionTitle } from '@/components/home/sections'
import { products, getProduct, getRelated } from '@/lib/products'

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const product = getProduct(id)
  if (!product) return { title: 'Produto não encontrado · Belice Modas' }
  return {
    title: `${product.name} · Belice Modas`,
    description: product.description,
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const product = getProduct(id)
  if (!product) notFound()

  const related = getRelated(product)

  return (
    <>
      <SiteHeader />
      <main>
        <nav className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <div className="flex gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <a href="/" className="hover:text-gold-dark transition-colors">Início</a>
            <span>/</span>
            <a href={`/produtos/${product.category}`} className="hover:text-gold-dark transition-colors">
              {product.categoryLabel}
            </a>
            <span>/</span>
            <span className="text-gold-dark">{product.name}</span>
          </div>
        </nav>

        <ProductDetail product={product} />

        <section className="bg-secondary/50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionTitle eyebrow="Você também vai amar" title="Produtos Relacionados" />
            <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
              {related.map((p) => (
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
