import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/admin-emails'
import { rateLimit, getIp } from '@/lib/rate-limit'
import { sincronizarPendentes } from '@/lib/mp-pedido'
import { logAdmin } from '@/lib/audit'

export async function POST(req: NextRequest) {
  const ip = getIp(req)
  const { allowed } = await rateLimit(ip, { maxRequests: 6, windowMs: 60_000 })
  if (!allowed) return NextResponse.json({ error: 'Muitas requisições.' }, { status: 429 })

  const session = await auth()
  const email = session?.user?.email
  if (!email || !isAdmin(email)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const r = await sincronizarPendentes()
    if (r.registrados > 0) await logAdmin({ adminEmail: email, acao: 'sincronizar_pagamentos', ip, detalhes: r })
    return NextResponse.json(r)
  } catch (err) {
    console.error('Erro na sincronização:', err)
    return NextResponse.json({ error: 'Falha ao sincronizar.' }, { status: 502 })
  }
}
