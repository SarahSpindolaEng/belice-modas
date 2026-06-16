/**
 * Melhor Envio token storage
 * Stores OAuth2 tokens in a local JSON file (.me-token.json)
 */

import fs from 'fs'
import path from 'path'

const TOKEN_FILE = path.join(process.cwd(), '.me-token.json')

export interface METoken {
  access_token: string
  refresh_token: string
  expires_at: number // unix ms
}

export function saveToken(data: {
  access_token: string
  refresh_token: string
  expires_in: number
}) {
  const token: METoken = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  }
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(token, null, 2))
  return token
}

export function loadToken(): METoken | null {
  try {
    if (!fs.existsSync(TOKEN_FILE)) return null
    return JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8')) as METoken
  } catch {
    return null
  }
}

export function isExpired(token: METoken): boolean {
  return Date.now() >= token.expires_at - 60_000 // 1 min buffer
}

export function getMEBase(): string {
  return process.env.MELHOR_ENVIO_ENV === 'sandbox'
    ? 'https://sandbox.melhorenvio.com.br'
    : 'https://melhorenvio.com.br'
}

export async function refreshToken(token: METoken): Promise<METoken | null> {
  const base = getMEBase()
  try {
    const res = await fetch(`${base}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: process.env.MELHOR_ENVIO_CLIENT_ID,
        client_secret: process.env.MELHOR_ENVIO_CLIENT_SECRET,
        refresh_token: token.refresh_token,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return saveToken(data)
  } catch {
    return null
  }
}

export async function getValidToken(): Promise<string | null> {
  let token = loadToken()
  if (!token) return null
  if (isExpired(token)) {
    token = await refreshToken(token)
  }
  return token?.access_token ?? null
}
