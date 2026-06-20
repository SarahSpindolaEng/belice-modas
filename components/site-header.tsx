'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X, ShoppingBag, Heart, ChevronDown, User, LogOut } from 'lucide-react'
import { categories } from '@/lib/products'
import { useCart } from '@/components/cart-context'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { AdminNotificacoes } from '@/components/admin-notificacoes'

const ADMIN_EMAILS = ['belicemodas6@gmail.com', 'sarahgiulia2005@gmail.com']

const mainLinks = [
  { href: '/inicio', label: 'Início' },
  { href: '/novidades', label: 'Novidades' },
]

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [productsOpen, setProductsOpen] = useState(false)
  const pathname = usePathname()
  const { itemCount, favorites } = useCart()
  const { data: session } = useSession()

  const isAdmin = ADMIN_EMAILS.includes(session?.user?.email ?? '')

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        {/* announcement bar */}
        <div className="bg-foreground text-background text-center text-xs tracking-[0.2em] uppercase py-2 font-light">
          Até 40% OFF na coleção · Moda feminina exclusiva
        </div>

        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* mobile menu button */}
          <button
            type="button"
            className="lg:hidden text-foreground p-1"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* desktop nav left */}
          <nav className="hidden lg:flex items-center gap-8 flex-1">
            {mainLinks.map((link) => (
              <NavLink key={link.href} href={link.href} active={pathname === link.href}>
                {link.label}
              </NavLink>
            ))}
            <div
              className="relative"
              onMouseEnter={() => setProductsOpen(true)}
              onMouseLeave={() => setProductsOpen(false)}
            >
              <button
                type="button"
                className="flex items-center gap-1 text-sm tracking-widest uppercase font-light text-foreground/80 hover:text-gold transition-colors"
              >
                Produtos
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {productsOpen && (
                <div className="absolute left-0 top-full w-56 border border-border bg-card shadow-lg z-50">
                  {categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/produtos/${cat.slug}`}
                      className="block px-5 py-3 text-sm font-light text-foreground/80 hover:bg-accent hover:text-gold-dark transition-colors border-b border-border last:border-0"
                    >
                      {cat.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <NavLink href="/produtos" active={pathname === '/produtos'}>
              Catálogo
            </NavLink>
          </nav>

          {/* logo center */}
          <Link href="/inicio" className="flex items-center gap-1.5 justify-center" aria-label="Belice Modas - Início">
            <Image
              src="/logo-belice-symbol.png"
              alt="Belice Modas"
              width={60}
              height={60}
              className="h-12 w-auto"
              priority
            />
            <div className="flex flex-col leading-none">
              <span className="font-serif text-xl tracking-[0.25em] text-foreground uppercase font-normal">Belice</span>
              <span className="font-sans text-[9px] uppercase tracking-[0.25em] text-gold-dark font-normal -mt-0.5 ml-[1px]">Modas</span>
            </div>
          </Link>

          {/* right icons */}
          <div className="flex items-center gap-5 lg:flex-1 lg:justify-end">
            {session && !isAdmin && (
              <Link
                href="/meus-pedidos"
                className="hidden lg:block text-sm tracking-widest uppercase font-light text-foreground/80 hover:text-gold transition-colors"
              >
                Meus Pedidos
              </Link>
            )}
            {session && isAdmin && (
              <>
                <Link
                  href="/admin/pedidos"
                  className="hidden lg:block text-sm tracking-widest uppercase font-light text-gold-dark hover:text-gold transition-colors"
                >
                  ⚙ Admin
                </Link>
                <div className="hidden lg:block">
                  <AdminNotificacoes />
                </div>
              </>
            )}
            <Link
              href="/contato"
              className="hidden lg:block text-sm tracking-widest uppercase font-light text-foreground/80 hover:text-gold transition-colors"
            >
              Contato
            </Link>
            {session ? (
              <div className="hidden lg:flex items-center gap-2 relative group">
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm font-light transition-colors"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-gradient text-[10px] font-medium uppercase text-gold-foreground">
                    {session.user?.name?.charAt(0) ?? <User className="h-4 w-4" />}
                  </span>
                  <span className="max-w-[100px] truncate text-xs uppercase tracking-wider text-gold-dark font-medium">{session.user?.name?.split(' ')[0]}</span>
                </button>
                <div className="absolute right-0 top-full w-44 border border-border bg-background shadow-lg hidden group-hover:block before:absolute before:-top-2 before:left-0 before:right-0 before:h-2 before:content-['']">
                  {!isAdmin && (
                    <Link href="/meus-pedidos" className="block px-4 py-3 text-xs uppercase tracking-wider text-foreground/80 hover:bg-accent hover:text-gold-dark transition-colors border-b border-border">
                      Meus Pedidos
                    </Link>
                  )}
                  {isAdmin && (
                    <Link href="/admin/pedidos" className="block px-4 py-3 text-xs uppercase tracking-wider text-gold-dark hover:bg-accent transition-colors border-b border-border">
                      ⚙ Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: '/inicio' })}
                    className="flex w-full items-center gap-2 px-4 py-3 text-xs uppercase tracking-wider text-foreground/80 hover:bg-accent hover:text-gold-dark transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Sair
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden lg:flex items-center gap-1.5 text-sm tracking-widest uppercase font-light text-foreground/80 hover:text-gold transition-colors"
              >
                <User className="h-4 w-4" /> Entrar
              </Link>
            )}
            <Link href="/favoritos" className="relative text-foreground hover:text-gold transition-colors" aria-label="Favoritos">
              <Heart className="h-5 w-5" />
              {favorites.length > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-gold-gradient text-[10px] font-medium text-gold-foreground">
                  {favorites.length}
                </span>
              )}
            </Link>
            <Link href="/carrinho" className="relative text-foreground hover:text-gold transition-colors" aria-label="Carrinho">
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-gold-gradient text-[10px] font-medium text-gold-foreground">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* mobile drawer — fora do <header> para evitar conflito de z-index */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[9999] lg:hidden">
          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          {/* drawer */}
          <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-background flex flex-col shadow-2xl">
            {/* header do drawer */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <Image
                src="/logo-belice.png"
                alt="Belice Modas"
                width={80}
                height={80}
                className="h-10 w-auto"
              />
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Fechar menu">
                <X className="h-6 w-6 text-foreground" />
              </button>
            </div>

            {/* área do usuário */}
            <div className="px-6 py-4 border-b border-border">
              {session ? (
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-gradient text-sm font-medium uppercase text-gold-foreground">
                    {session.user?.name?.charAt(0) ?? '?'}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{session.user?.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{session.user?.email}</p>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 w-full rounded-md border border-gold-dark py-2.5 text-sm uppercase tracking-widest font-light text-gold-dark hover:bg-accent transition-colors"
                >
                  <User className="h-4 w-4" />
                  Entrar na conta
                </Link>
              )}
            </div>

            {/* nav links */}
            <nav className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-0.5">
              {mainLinks.map((link) => (
                <MobileLink key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                  {link.label}
                </MobileLink>
              ))}

              <p className="px-3 pt-4 pb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                Produtos
              </p>
              {categories.map((cat) => (
                <MobileLink
                  key={cat.slug}
                  href={`/produtos/${cat.slug}`}
                  onClick={() => setMobileOpen(false)}
                  indent
                >
                  {cat.label}
                </MobileLink>
              ))}

              <div className="my-2 border-t border-border" />

              <MobileLink href="/produtos" onClick={() => setMobileOpen(false)}>
                Catálogo completo
              </MobileLink>
              <MobileLink href="/contato" onClick={() => setMobileOpen(false)}>
                Contato
              </MobileLink>
              <MobileLink href="/favoritos" onClick={() => setMobileOpen(false)}>
                Favoritos
              </MobileLink>
              <MobileLink href="/carrinho" onClick={() => setMobileOpen(false)}>
                Carrinho
              </MobileLink>

              {session && !isAdmin && (
                <MobileLink href="/meus-pedidos" onClick={() => setMobileOpen(false)}>
                  Meus Pedidos
                </MobileLink>
              )}
              {session && isAdmin && (
                <MobileLink href="/admin/pedidos" onClick={() => setMobileOpen(false)}>
                  ⚙ Admin
                </MobileLink>
              )}
            </nav>

            {/* rodapé do drawer: sair */}
            {session && (
              <div className="px-4 py-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => { signOut({ callbackUrl: '/inicio' }); setMobileOpen(false) }}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-3 text-sm uppercase tracking-wider font-light text-foreground/70 hover:bg-accent hover:text-gold-dark transition-colors"
                >
                  <LogOut className="h-4 w-4" /> Sair da conta
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string
  active?: boolean
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        'text-sm tracking-widest uppercase font-light transition-colors hover:text-gold',
        active ? 'text-gold' : 'text-foreground/80',
      )}
    >
      {children}
    </Link>
  )
}

function MobileLink({
  href,
  onClick,
  indent,
  children,
}: {
  href: string
  onClick: () => void
  indent?: boolean
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'block rounded-md py-3 text-sm uppercase tracking-wider font-light text-foreground/80 hover:bg-accent hover:text-gold-dark transition-colors',
        indent ? 'px-6' : 'px-3',
      )}
    >
      {children}
    </Link>
  )
}
