import Link from 'next/link'
import Image from 'next/image'
import { MessageCircle, Mail } from 'lucide-react'
import { categories } from '@/lib/products'

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/logo-belice-symbol.png"
                alt="Belice Modas"
                width={50}
                height={50}
                className="h-10 w-auto"
              />
              <div className="flex flex-col leading-none">
                <span className="font-serif text-lg tracking-[0.25em] text-background uppercase">Belice</span>
                <span className="font-sans text-[8px] uppercase tracking-[0.25em] text-gold-dark ml-[1px]">Modas</span>
              </div>
            </div>
            <p className="text-sm font-light leading-relaxed text-background/70 max-w-xs">
              Moda feminina premium. Elegância, sofisticação e exclusividade em
              cada peça da nossa coleção.
            </p>
          </div>

          <div>
            <h3 className="font-serif text-lg text-gold mb-4">Produtos</h3>
            <ul className="space-y-2.5">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/produtos/${cat.slug}`}
                    className="text-sm font-light text-background/70 hover:text-gold transition-colors"
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-lg text-gold mb-4">Institucional</h3>
            <ul className="space-y-2.5">
              {[
                { href: '/politicas/troca', label: 'Política de Troca e Devolução' },
                { href: '/politicas/privacidade', label: 'Política de Privacidade' },
                { href: '/politicas/termos', label: 'Termos de Uso' },
                { href: '/contato', label: 'Contato' },
                { href: '/pedidos', label: 'Meus Pedidos' },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm font-light text-background/70 hover:text-gold transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-lg text-gold mb-4">Atendimento</h3>
            <ul className="space-y-2.5 text-sm font-light text-background/70">
              <li className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-gold" />
                (62) 99314-5116
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gold" />
                belicemodas6@gmail.com
              </li>
              <li className="pt-1">Seg a Sex · 8h às 18h</li>
              <li className="text-background/50 text-xs pt-0.5">Entregamos para todo o Brasil</li>
            </ul>
            <div className="flex gap-4 mt-5">
              <a href="https://instagram.com/eubelicemodas6" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-background/70 hover:text-gold transition-colors">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
              </a>
              <a href="https://wa.me/5562993145116" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="text-background/70 hover:text-gold transition-colors">
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-background/15 pt-6 text-center">
          <p className="text-xs font-light tracking-wider text-background/50">
            © {new Date().getFullYear()} Belice Modas. Todos os direitos
            reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
