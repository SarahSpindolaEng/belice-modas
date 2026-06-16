export function PageBanner({
  title,
  subtitle,
  description,
  eyebrow,
  breadcrumb,
}: {
  title: string
  subtitle?: string
  description?: string
  eyebrow?: string
  breadcrumb?: { label: string; href?: string }[]
}) {
  return (
    <section className="border-b border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 text-center">
        {breadcrumb && (
          <nav className="mb-4 flex justify-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            {breadcrumb.map((b, i) => (
              <span key={b.label} className="flex items-center gap-2">
                {i > 0 && <span>/</span>}
                {b.href ? (
                  <a href={b.href} className="hover:text-gold-dark transition-colors">
                    {b.label}
                  </a>
                ) : (
                  <span className="text-gold-dark">{b.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="font-serif text-4xl text-foreground sm:text-5xl text-balance">
          {title}
        </h1>
        {subtitle && (
          <p className="mx-auto mt-3 max-w-xl text-sm font-light leading-relaxed text-muted-foreground text-pretty">
            {subtitle}
          </p>
        )}
        <div className="mx-auto mt-5 h-px w-16 bg-gold-gradient" />
      </div>
    </section>
  )
}
