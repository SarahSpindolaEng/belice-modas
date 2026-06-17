/**
 * Rate limiter por IP.
 *
 * Ordem de preferencia:
 *  1. Upstash Redis (se UPSTASH_REDIS_REST_URL/TOKEN estiverem setados).
 *  2. Postgres/Neon (padrao — usa o mesmo banco do site). Store COMPARTILHADO
 *     entre todas as instancias serverless, resistente a cold start.
 *  3. Memoria (fallback se o banco falhar) — por instancia, mais fraco.
 *
 * A tabela `rate_limits` e criada automaticamente na primeira execucao.
 */

import sql from '@/lib/db'

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

// ---------- 3. memoria (fallback) ----------
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

// ---------- 1. Upstash Redis ----------
async function upstashRateLimit(ip: string, options: Options): Promise<Result> {
  const url = process.env.UPSTASH_REDIS_REST_URL!
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!
  const key = `rl:${ip}:${options.windowMs}:${options.maxRequests}`
  const headers = { Authorization: `Bearer ${token}` }

  const incrRes = await fetch(`${url}/incr/${encodeURIComponent(key)}`, { headers })
  if (!incrRes.ok) throw new Error('Upstash INCR falhou')
  const { result: count } = (await incrRes.json()) as { result: number }
  if (count === 1) {
    await fetch(`${url}/pexpire/${encodeURIComponent(key)}/${options.windowMs}`, { headers })
  }
  if (count > options.maxRequests) return { allowed: false, remaining: 0 }
  return { allowed: true, remaining: options.maxRequests - count }
}

// ---------- 2. Postgres / Neon ----------
let schemaReady: Promise<unknown> | null = null
function ensureSchema() {
  if (!schemaReady) {
    schemaReady = sql`
      CREATE TABLE IF NOT EXISTS rate_limits (
        key       text PRIMARY KEY,
        count     integer NOT NULL,
        reset_at  timestamptz NOT NULL
      )
    `
  }
  return schemaReady
}

async function postgresRateLimit(ip: string, options: Options): Promise<Result> {
  await ensureSchema()
  const key = `${ip}:${options.windowMs}:${options.maxRequests}`

  // Upsert atomico: incrementa dentro da janela, ou reinicia se a janela expirou.
  const rows = (await sql`
    INSERT INTO rate_limits (key, count, reset_at)
    VALUES (${key}, 1, now() + (interval '1 millisecond' * ${options.windowMs}))
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limits.reset_at <= now() THEN 1 ELSE rate_limits.count + 1 END,
      reset_at = CASE WHEN rate_limits.reset_at <= now()
                      THEN now() + (interval '1 millisecond' * ${options.windowMs})
                      ELSE rate_limits.reset_at END
    RETURNING count
  `) as { count: number }[]

  const count = rows[0]?.count ?? 1

  // Limpeza oportunista (1% das vezes) das chaves expiradas, pra tabela nao crescer.
  if (Math.random() < 0.01) {
    try { await sql`DELETE FROM rate_limits WHERE reset_at < now() - interval '1 hour'` } catch {}
  }

  if (count > options.maxRequests) return { allowed: false, remaining: 0 }
  return { allowed: true, remaining: options.maxRequests - count }
}

export async function rateLimit(ip: string, options: Options): Promise<Result> {
  // 1. Upstash, se configurado
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      return await upstashRateLimit(ip, options)
    } catch (err) {
      console.error('Rate limit Upstash indisponivel:', err)
    }
  }
  // 2. Postgres/Neon (padrao)
  if (process.env.DATABASE_URL) {
    try {
      return await postgresRateLimit(ip, options)
    } catch (err) {
      console.error('Rate limit via banco indisponivel, usando memoria:', err)
    }
  }
  // 3. Memoria (fallback)
  return memoryRateLimit(ip, options)
}

export function getIp(req: Request): string {
  // No Vercel, o IP real e o ULTIMO do X-Forwarded-For (adicionado pela infraestrutura).
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const ips = forwarded.split(',').map((ip) => ip.trim()).filter(Boolean)
    return ips[ips.length - 1] ?? 'unknown'
  }
  return req.headers.get('x-real-ip') ?? 'unknown'
}
