'use client'

import { useState } from 'react'
import { Truck, Loader2, MapPin } from 'lucide-react'
import { formatPrice } from '@/lib/products'
import { cn } from '@/lib/utils'

interface FreteOpcao {
  id: number
  nome: string
  transportadora: string
  preco: number
  prazo: number
  logo: string | null
}

interface FreteCalculatorProps {
  quantidade: number
  onSelect: (opcao: FreteOpcao | null) => void
  selected: FreteOpcao | null
}

export function FreteCalculator({ quantidade, onSelect, selected }: FreteCalculatorProps) {
  const [cep, setCep] = useState('')
  const [loading, setLoading] = useState(false)
  const [opcoes, setOpcoes] = useState<FreteOpcao[]>([])
  const [erro, setErro] = useState('')
  const [calculado, setCalculado] = useState(false)

  function formatarCep(valor: string) {
    const digits = valor.replace(/\D/g, '').slice(0, 8)
    if (digits.length > 5) return digits.slice(0, 5) + '-' + digits.slice(5)
    return digits
  }

  async function calcular() {
    const cepLimpo = cep.replace('-', '')
    if (cepLimpo.length !== 8) {
      setErro('Informe um CEP válido com 8 dígitos.')
      return
    }

    setLoading(true)
    setErro('')
    setOpcoes([])
    onSelect(null)

    try {
      const res = await fetch('/api/frete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cep_destino: cepLimpo, quantidade }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setErro('Não foi possível calcular o frete. Tente novamente mais tarde.')
        return
      }

      if (data.opcoes.length === 0) {
        setErro('Nenhuma opção de entrega disponível para este CEP.')
        return
      }

      setOpcoes(data.opcoes)
      setCalculado(true)
      // Seleciona automaticamente a opção mais barata
      onSelect(data.opcoes[0])
    } catch {
      setErro('Não foi possível calcular o frete. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <p className="text-xs uppercase tracking-widest text-foreground">Calcular Frete</p>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            inputMode="numeric"
            placeholder="00000-000"
            value={cep}
            onChange={(e) => setCep(formatarCep(e.target.value))}
            onKeyDown={(e) => e.key === 'Enter' && calcular()}
            className="w-full border border-border bg-background py-2.5 pl-9 pr-3 text-sm font-light text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={calcular}
          disabled={loading}
          className="flex items-center gap-2 border border-foreground bg-foreground px-4 py-2.5 text-xs uppercase tracking-widest text-background transition-colors hover:bg-gold-gradient hover:border-gold hover:text-gold-foreground disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
          {loading ? 'Calculando' : 'Calcular'}
        </button>
      </div>

      {erro && (
        <p className="text-xs text-destructive">{erro}</p>
      )}

      {calculado && opcoes.length > 0 && (
        <div className="space-y-2">
          {opcoes.map((opcao) => (
            <button
              key={opcao.id}
              type="button"
              onClick={() => onSelect(opcao)}
              className={cn(
                'w-full flex items-center justify-between gap-3 border px-4 py-3 text-left transition-colors',
                selected?.id === opcao.id
                  ? 'border-gold bg-accent'
                  : 'border-border hover:border-foreground/40',
              )}
            >
              <div className="flex items-center gap-3">
                {opcao.logo ? (
                  <img src={opcao.logo} alt={opcao.transportadora} className="h-6 w-auto object-contain" />
                ) : (
                  <Truck className="h-5 w-5 shrink-0 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-light text-foreground">{opcao.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {opcao.transportadora} · {opcao.prazo} {opcao.prazo === 1 ? 'dia útil' : 'dias úteis'}
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-sm font-medium text-foreground">
                {opcao.preco === 0 ? 'Grátis' : formatPrice(opcao.preco)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
