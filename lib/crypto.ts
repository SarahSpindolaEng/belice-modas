/**
 * Criptografia de dados sensíveis (ex.: CPF) com AES-256-GCM.
 *
 * Chave: DATA_ENCRYPTION_KEY (32 bytes em base64 ou 64 caracteres hex).
 * Gerar: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 *
 * Valores criptografados têm o prefixo "enc:v1:". Valores antigos (texto puro)
 * continuam legíveis — decrypt() devolve o valor original se não tiver prefixo.
 * Se a chave não estiver configurada, o valor é salvo em texto puro (com aviso)
 * para não derrubar o checkout.
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const PREFIX = 'enc:v1:'

function getKey(): Buffer | null {
  const raw = process.env.DATA_ENCRYPTION_KEY?.trim()
  if (!raw) return null
  const key = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64')
  if (key.length !== 32) {
    console.error('DATA_ENCRYPTION_KEY inválida: precisa ter 32 bytes (base64 ou hex).')
    return null
  }
  return key
}

export function encrypt(value: string): string {
  if (!value) return value
  const key = getKey()
  if (!key) {
    console.warn('DATA_ENCRYPTION_KEY não configurada — dado sensível salvo sem criptografia.')
    return value
  }
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return PREFIX + Buffer.concat([iv, tag, enc]).toString('base64')
}

export function decrypt(value: string | null | undefined): string {
  if (!value) return ''
  if (!value.startsWith(PREFIX)) return value // legado (texto puro)
  const key = getKey()
  if (!key) throw new Error('DATA_ENCRYPTION_KEY ausente — não é possível ler dado criptografado.')
  const buf = Buffer.from(value.slice(PREFIX.length), 'base64')
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const data = buf.subarray(28)
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}
