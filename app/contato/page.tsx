'use client'

import { useState } from 'react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PageBanner } from '@/components/page-banner'
import { Phone, Mail, Clock, MessageCircle, Package } from 'lucide-react'

export default function ContatoPage() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, mensagem }),
      })
      if (!res.ok) throw new Error()
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  return (
    <>
      <SiteHeader />
      <main>
        <PageBanner
          eyebrow="Fale Conosco"
          title="Contato"
          subtitle="Estamos aqui para ajudar. Entre em contato e responderemos o mais breve possível."
        />

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* info */}
            <div>
              <h2 className="font-serif text-3xl text-foreground">Belice Modas</h2>
              <p className="mt-4 max-w-md font-light leading-relaxed text-muted-foreground">
                Moda feminina com elegância e exclusividade. Converse com a gente
                pelos canais abaixo.
              </p>

              <ul className="mt-8 space-y-5">
                <li className="flex items-start gap-4">
                  <Phone className="mt-1 h-5 w-5 shrink-0 text-gold-dark" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Telefone / WhatsApp</p>
                    <p className="text-sm font-light text-muted-foreground">(62) 93145-1116</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Mail className="mt-1 h-5 w-5 shrink-0 text-gold-dark" />
                  <div>
                    <p className="text-sm font-medium text-foreground">E-mail</p>
                    <p className="text-sm font-light text-muted-foreground">belicemodas6@gmail.com</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Clock className="mt-1 h-5 w-5 shrink-0 text-gold-dark" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Horário de Atendimento</p>
                    <p className="text-sm font-light text-muted-foreground">Segunda a Sexta · 8h às 18h</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <Package className="mt-1 h-5 w-5 shrink-0 text-gold-dark" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Entregas</p>
                    <p className="text-sm font-light text-muted-foreground">Para todo o Brasil via Melhor Envio</p>
                  </div>
                </li>
              </ul>

              <div className="mt-8 flex gap-3">
                <a
                  href="https://wa.me/5562931451116"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-gold-gradient px-5 py-3 text-xs uppercase tracking-widest text-gold-foreground transition-opacity hover:opacity-90"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
                <a
                  href="https://instagram.com/eubelicemodas6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-foreground px-5 py-3 text-xs uppercase tracking-widest text-foreground transition-colors hover:bg-foreground hover:text-background"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                  @eubelicemodas6
                </a>
              </div>
            </div>

            {/* form */}
            <div className="bg-secondary/40 p-8">
              {status === 'sent' ? (
                <div className="flex h-full flex-col items-center justify-center text-center py-12">
                  <h3 className="font-serif text-2xl text-foreground">Mensagem enviada!</h3>
                  <p className="mt-3 font-light text-muted-foreground">
                    Obrigado pelo contato. Retornaremos em breve.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h3 className="font-serif text-2xl text-foreground">Envie uma mensagem</h3>
                  <div>
                    <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                      Nome
                    </label>
                    <input
                      required
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full border border-input bg-background px-4 py-3 text-sm outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                      E-mail
                    </label>
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-input bg-background px-4 py-3 text-sm outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
                      Mensagem
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={mensagem}
                      onChange={(e) => setMensagem(e.target.value)}
                      className="w-full resize-none border border-input bg-background px-4 py-3 text-sm outline-none focus:border-gold"
                    />
                  </div>
                  {status === 'error' && (
                    <p className="text-xs text-destructive">
                      Erro ao enviar. Tente novamente ou entre em contato pelo WhatsApp.
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full bg-foreground py-4 text-xs uppercase tracking-widest text-background transition-colors hover:bg-gold-dark disabled:opacity-60"
                  >
                    {status === 'loading' ? 'Enviando...' : 'Enviar mensagem'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
