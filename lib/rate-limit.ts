/**
 * Rate limiter por IP.
 *
 * - Se UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN estiverem configurados,
 *   usa Redis (Upstash) — contagem COMPARTILHADA entre todas as instancias serverless,
 *   resistente a cold start. Esta e a protecao real recomendada em producao.
 * - Caso contrario, cai para um contador em memoria (por instancia) — suficiente
 *   para dev/abusos simples, mas contornavel em ambiente multi-instancia.
 */

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

interface Options {
  maxRequests: number
  windowMs: number
}

interface Result {
  allowed: boolean
  remaining: number
}

function memoryRateLimit(ip: string, options: Options): Result {
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

async function upstashRateLimit(ip: string, options: Options): Promise<Result> {
  const url = process.env.UPSTASH_REDIS_REST_URL!
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!
  const key = `rl:${ip}:${options.windowMs}:${options.maxRequests}`
  const headers = { Authorization: `Bearer ${token}` }

  // INCR atomico no Redis
  const incrRes = await fetch(`${url}/incr/${encodeURIComponent(key)}`, { headers })
  if (!incrRes.ok) throw new Error('Upstash INCR falhou')
  const { result: count } = (await incrRes.json()) as { result: number }

  // Na primeira requisicao da janela, define o tempo de expiracao
  if (count === 1) {
    await fetch(`${url}/pexpire/${encodeURIComponent(key)}/${options.windowMs}`, { headers })
  }

  if (count > options.maxRequests) {
    return { allowed: false, remaining: 0 }
  }
  return { allowed: true, remaining: options.maxRequests - count }
}

export async function rateLimit(ip: string, options: Options): Promise<Result> {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      return await upstashRateLimit(ip, options)
    } catch (err) {
      // Se o Redis falhar, nao derruba a rota — cai para memoria.
      console.error('Rate limit Upstash indisponivel, usando memoria:', err)
      return memoryRateLimit(ip, options)
    }
  }
  return memoryRateLimit(ip, options)
}

export function getIp(req: Request): string {
  // No Vercel, o IP real e o ULTIMO do X-Forwarded-For (adicionado pela infraestrutura).
  // Pegar o primeiro permite bypass: atacante envia X-Forwarded-For: 1.2.3.4 (IP falso).
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const ips = forwarded.split(',').map((ip) => ip.trim()).filter(Boolean)
    return ips[ips.length - 1] ?? 'unknown'
  }
  return req.headers.get('x-real-ip') ?? 'unknown'
}
