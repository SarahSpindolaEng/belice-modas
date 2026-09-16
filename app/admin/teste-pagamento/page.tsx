'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/components/cart-context'
import { testProduct } from '@/lib/products'

export default function TestePagamentoPage() {
  const { addToCart, items } = useCart()
  const router = useRouter()
  const jaNoCarrinho = items.some((i) => i.product.id === testProduct.id)

  function adicionar() {
    if (!jaNoCarrinho) addToCart(testProduct, 'M', 1)
    router.push('/carrinho')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 px-4">
      <div className="w-full max-w-md border border-border bg-background p-8">
        <h1 className="font-serif text-3xl text-foreground">Compra de teste</h1>
        <div className="mt-2 h-px w-12 bg-gold-gradient" />

        <p className="mt-6 text-sm font-light text-muted-foreground">
          Coloca um <strong>produto de teste de R$ 5,00</strong> no seu carrinho. Depois é só seguir
          exatamente como uma cliente: calcular o frete, preencher os dados, finalizar e pagar no
          Mercado Pago. O produto só aparece para admin e não existe no catálogo.
        </p>
        <p className="mt-3 text-xs font-light text-muted-foreground">
          O frete é calculado como 1 vestido e cobrado de verdade (ou escolha &quot;Retirada&quot; para pagar só R$ 5,00).
          Depois, use &quot;Negar&quot; no Painel de Pedidos para testar o estorno.
        </p>

        <button
          type="button"
          onClick={adicionar}
          className="mt-6 w-full bg-foreground px-5 py-3 text-xs uppercase tracking-widest text-background transition-colors hover:bg-gold-gradient hover:text-gold-foreground"
        >
          {jaNoCarrinho ? 'Ir para o carrinho' : 'Colocar no carrinho (R$ 5,00)'}
        </button>

        <div className="mt-8 border-t border-border pt-6">
          <Link href="/admin/pedidos" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-gold-dark">
            ← Painel de pedidos
          </Link>
        </div>
      </div>
    </div>
  )
}
