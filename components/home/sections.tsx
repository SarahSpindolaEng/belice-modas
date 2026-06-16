import Link from 'next/link'
import { categories } from '@/lib/products'

const promoImages: Record<string, string> = {
  vestidos: '/products/real/produto-06.jpg',
  calcas: '/products/real/produto-16.jpg',
  saias: '/products/real/produto-82.jpg',
  bermudas: '/products/real/produto-18.jpg',
  territorial: '/products/real/produto-01.jpg',
}

export function PromoBanner() {
  return (
    <section className="bg-foreground py-5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center font-serif text-2xl text-gold sm:text-3xl">
          Liquidação de Temporada · Até 40% OFF
        </p>
        <p className="mt-1 text-center text-xs uppercase tracking-[0.25em] text-background/70">
          Aproveite enquanto durarem os estoques
        </p>
      </div>
    </section>
  )
}

export function CategoryGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
      <SectionTitle eyebrow="Explore" title="Nossas Categorias" />
      <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/produtos/${cat.slug}`}
            className="group relative aspect-[3/4] overflow-hidden bg-secondary min-w-0 w-full"
          >
            <img
              src={promoImages[cat.slug] || '/placeholder.svg'}
              alt={cat.label}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-foreground/30 transition-colors group-hover:bg-foreground/45" />
            <div className="absolute inset-0 flex items-end p-4">
              <span className="font-serif text-lg text-background sm:text-xl">
                {cat.label}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export function SectionTitle({
  eyebrow,
  title,
  align = 'center',
}: {
  eyebrow?: string
  title: string
  align?: 'center' | 'left'
}) {
  return (
    <div className={align === 'center' ? 'text-center' : 'text-left'}>
      {eyebrow && (
        <p className="text-xs uppercase tracking-[0.3em] text-gold-dark">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-2 font-serif text-4xl text-foreground sm:text-5xl text-balance">
        {title}
      </h2>
      <div
        className={`mt-4 h-px w-16 bg-gold-gradient ${align === 'center' ? 'mx-auto' : ''}`}
      />
    </div>
  )
}
