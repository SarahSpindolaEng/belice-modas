import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PageBanner } from '@/components/page-banner'
import { notFound } from 'next/navigation'

const policies: Record<
  string,
  { title: string; eyebrow: string; intro: string; sections: { heading: string; body: string[] }[] }
> = {
  troca: {
    eyebrow: 'Institucional',
    title: 'Política de Troca e Devolução',
    intro:
      'Na Belice Modas, sua satisfação é prioridade. Confira abaixo como funcionam nossas trocas e devoluções.',
    sections: [
      {
        heading: 'Prazo para troca',
        body: [
          'Você tem até 7 dias corridos a partir do recebimento do produto para solicitar a troca ou devolução (direito de arrependimento, conforme o Código de Defesa do Consumidor).',
          'A peça deve estar sem sinais de uso, com a etiqueta original e na embalagem.',
        ],
      },
      {
        heading: 'Como solicitar',
        body: [
          'Entre em contato pelo WhatsApp ou e-mail informando o número do pedido e o motivo da troca.',
          'Nossa equipe enviará as instruções para postagem ou retirada do produto.',
        ],
      },
      {
        heading: 'Reembolso',
        body: [
          'Para pagamentos via Pix ou boleto, o reembolso é feito em até 10 dias úteis.',
          'Para cartão de crédito, o estorno aparece em até duas faturas, conforme a operadora.',
        ],
      },
    ],
  },
  privacidade: {
    eyebrow: 'Institucional',
    title: 'Política de Privacidade',
    intro:
      'Levamos a sua privacidade a sério. Saiba como tratamos os seus dados pessoais.',
    sections: [
      {
        heading: 'Coleta de dados',
        body: [
          'Coletamos apenas as informações necessárias para processar seus pedidos e melhorar sua experiência de compra.',
        ],
      },
      {
        heading: 'Uso das informações',
        body: [
          'Seus dados são utilizados para processar pagamentos, realizar entregas e enviar comunicações sobre seus pedidos.',
          'Não compartilhamos seus dados com terceiros para fins de marketing sem o seu consentimento.',
        ],
      },
      {
        heading: 'Segurança',
        body: [
          'Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado.',
        ],
      },
    ],
  },
  termos: {
    eyebrow: 'Institucional',
    title: 'Termos de Uso',
    intro: 'Ao utilizar nossa loja, você concorda com os termos descritos abaixo.',
    sections: [
      {
        heading: 'Uso do site',
        body: [
          'O conteúdo deste site é destinado a fins de compra pessoal. É proibida a reprodução sem autorização.',
        ],
      },
      {
        heading: 'Preços e disponibilidade',
        body: [
          'Os preços e a disponibilidade dos produtos podem ser alterados sem aviso prévio.',
          'Empenhamo-nos para manter as informações sempre atualizadas e precisas.',
        ],
      },
      {
        heading: 'Pedidos',
        body: [
          'A confirmação do pedido está sujeita à aprovação do pagamento e à disponibilidade de estoque.',
        ],
      },
    ],
  },
}

export function generateStaticParams() {
  return Object.keys(policies).map((slug) => ({ slug }))
}

export default async function PoliticaPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const policy = policies[slug]
  if (!policy) notFound()

  return (
    <>
      <SiteHeader />
      <main>
        <PageBanner eyebrow={policy.eyebrow} title={policy.title} description={policy.intro} />
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="space-y-10">
            {policy.sections.map((s) => (
              <div key={s.heading}>
                <h2 className="font-serif text-2xl text-foreground">{s.heading}</h2>
                <div className="mt-3 space-y-3">
                  {s.body.map((p, i) => (
                    <p key={i} className="font-light leading-relaxed text-muted-foreground">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
