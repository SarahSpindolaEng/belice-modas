'use client'

import { useState, useMemo } from 'react'
import { ProductCard } from '@/components/product-card'
import { categories, type Product, type Category } from '@/lib/products'
import { cn } from '@/lib/utils'

type SortKey = 'destaque' | 'menor' | 'maior' | 'novidades'

export function CatalogGrid({
  products,
  activeCategory,
  showFilters = true,
}: {
  products: Product[]
  activeCategory?: Category
  showFilters?: boolean
}) {
  const [filter, setFilter] = useState<Category | 'todos'>(
    activeCategory ?? 'todos',
  )
  const [sort, setSort] = useState<SortKey>('destaque')

  const visible = useMemo(() => {
    let list =
      filter === 'todos'
        ? products
        : products.filter((p) => p.category === filter)
    list = [...list]
    if (sort === 'menor') list.sort((a, b) => a.price - b.price)
    if (sort === 'maior') list.sort((a, b) => b.price - a.price)
    if (sort === 'novidades')
      list.sort((a, b) => Number(b.isNew) - Number(a.isNew))
    return list
  }, [products, filter, sort])

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        {showFilters ? (
          <div className="flex flex-wrap gap-2">
            <FilterChip active={filter === 'todos'} onClick={() => setFilter('todos')}>
              Todos
            </FilterChip>
            {categories.map((cat) => (
              <FilterChip
                key={cat.slug}
                active={filter === cat.slug}
                onClick={() => setFilter(cat.slug)}
              >
                {cat.label}
              </FilterChip>
            ))}
          </div>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-3">
          <label
            htmlFor="sort"
            className="text-xs uppercase tracking-widest text-muted-foreground"
          >
            Ordenar
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="border border-border bg-background px-3 py-2 text-sm font-light text-foreground focus:border-gold focus:outline-none"
          >
            <option value="destaque">Destaque</option>
            <option value="novidades">Novidades</option>
            <option value="menor">Menor preço</option>
            <option value="maior">Maior preço</option>
          </select>
        </div>
      </div>

      <p className="mt-6 text-sm font-light text-muted-foreground">
        {visible.length} {visible.length === 1 ? 'produto' : 'produtos'}
      </p>

      {visible.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className="mt-16 text-center font-light text-muted-foreground">
          Nenhum produto encontrado nesta categoria.
        </p>
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'border px-4 py-2 text-xs uppercase tracking-widest transition-colors',
        active
          ? 'border-gold bg-gold-gradient text-gold-foreground'
          : 'border-border bg-background text-foreground/70 hover:border-gold hover:text-gold-dark',
      )}
    >
      {children}
    </button>
  )
}
