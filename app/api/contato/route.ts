import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { rateLimit, getIp } from '@/lib/rate-limit'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function POST(req: NextRequest) {
  // Rate limit: máx 5 mensagens por IP a cada 10 minutos
  const ip = getIp(req)
  const { allowed } = await rateLimit(ip, { maxRequests: 5, windowMs: 10 * 60 * 1000 })
  if (!allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde alguns minutos.' },
      { status: 429 },
    )
  }

  const body = await req.json().catch(() => null)
  const nome = typeof body?.nome === 'string' ? body.nome.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim() : ''
  const mensagem = typeof body?.mensagem === 'string' ? body.mensagem.trim() : ''

  if (!nome || !email || !mensagem) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'E-mail inválido.' }, { status: 400 })
  }

  if (nome.length > 100 || email.length > 200 || mensagem.length > 2000) {
    return NextResponse.json({ error: 'Campos muito longos.' }, { status: 400 })
  }

  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD

  if (!user || !pass) {
    return NextResponse.json({ error: 'Configuração de email ausente.' }, { status: 503 })
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })

  const nomeEsc = escapeHtml(nome.replace(/[\r\n]+/g, ' '))
  const emailEsc = escapeHtml(email)
  const mensagemEsc = escapeHtml(mensagem)

  try {
    await transporter.sendMail({
      from: `"Belice Modas" <${user}>`,
      to: user,
      replyTo: email,
      subject: `Contato do site — ${nomeEsc}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#1a1a1a">Nova mensagem de contato</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 0;color:#666;width:100px">Nome</td><td style="padding:8px 0">${nomeEsc}</td></tr>
            <tr><td style="padding:8px 0;color:#666">E-mail</td><td style="padding:8px 0"><a href="mailto:${emailEsc}">${emailEsc}</a></td></tr>
          </table>
          <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
          <p style="white-space:pre-wrap;color:#1a1a1a">${mensagemEsc}</p>
        </div>
      `,
    })
  } catch (err) {
    console.error('Erro ao enviar contato:', err)
    return NextResponse.json({ error: 'Não foi possível enviar agora. Tente mais tarde.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
