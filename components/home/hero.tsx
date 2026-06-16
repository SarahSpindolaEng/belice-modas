import Link from 'next/link'
import Image from 'next/image'

export function Hero() {
  return (
    <section className="relative h-[70vh] min-h-[520px] w-full overflow-hidden bg-secondary">
      <Image
        src="/banner-hero.jpg"
        alt="Coleção Belice Modas"
        fill
        priority
        sizes="100vw"
        className="object-cover object-top"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 via-foreground/15 to-transparent" />
      <div className="relative mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl text-background">
          <h1 className="mt-4 italic font-normal text-4xl sm:text-5xl lg:text-6xl tracking-wide" style={{ fontFamily: 'var(--font-bodoni)', lineHeight: '1' }}>
            <span className="whitespace-nowrap">Elegância que veste</span><br />a sua história
          </h1>
          <p className="mt-5 max-w-md text-xl font-light leading-relaxed text-background/85">
            Peças exclusivas de moda feminina com até{' '}
            <span className="text-white font-semibold underline decoration-gold decoration-2">40% OFF</span>. Sofisticação
            em cada detalhe.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/produtos"
              className="bg-gold-gradient px-8 py-4 text-xs uppercase tracking-widest text-gold-foreground transition-opacity hover:opacity-90"
            >
              Ver Coleção
            </Link>
            <Link
              href="/novidades"
              className="border border-background px-8 py-4 text-xs uppercase tracking-widest text-background transition-colors hover:bg-background hover:text-foreground"
            >
              Novidades
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
