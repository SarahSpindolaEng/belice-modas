/**
 * Rate limiter simples em memória por IP.
 * Funciona por instância serverless — não é compartilhado entre instâncias,
 * mas é suficiente para bloquear abusos comuns.
 */

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

export function rateLimit(
  ip: string,
  options: { maxRequests: number; windowMs: number },
): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + options.windowMs })
    return { allowed: true, remaining: options.maxRequests - 1 }
  }

  if (entry.count >= options.maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: options.maxRequests - entry.count }
}

export function getIp(req: Request): string {
  // No Vercel, o IP real é o ÚLTIMO do X-Forwarded-For (adicionado pela infraestrutura).
  // Pegar o primeiro permite bypass: atacante envia X-Forwarded-For: 1.2.3.4 (IP falso).
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const ips = forwarded.split(',').map((ip) => ip.trim()).filter(Boolean)
    // Usa o último IP (injetado pelo Vercel/proxy confiável), não o primeiro (cliente)
    return ips[ips.length - 1] ?? 'unknown'
  }
  return req.headers.get('x-real-ip') ?? 'unknown'
}
