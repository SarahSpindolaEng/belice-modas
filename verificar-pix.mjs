// Verifica se a conta do Mercado Pago (MP_ACCESS_TOKEN do .env.local) tem Pix habilitado.
// Uso: node verificar-pix.mjs   — não mostra o token.
import fs from 'fs'

const env = fs.readFileSync('.env.local', 'utf8')
const m = env.match(/^MP_ACCESS_TOKEN=(.*)$/m)
if (!m) { console.log('MP_ACCESS_TOKEN não encontrado no .env.local'); process.exit(1) }
const token = m[1].trim().replace(/^["']|["']$/g, '')
const headers = { Authorization: `Bearer ${token}` }

console.log('Tipo de credencial:', token.startsWith('APP_USR-') ? 'PRODUÇÃO' : token.startsWith('TEST-') ? 'TESTE (Pix não funciona)' : 'desconhecido')

const me = await (await fetch('https://api.mercadopago.com/users/me', { headers })).json()
console.log('Conta dona do token:', me.nickname ?? '-', '|', me.email ?? '-', '| id', me.id ?? '-')

const metodos = await (await fetch('https://api.mercadopago.com/v1/payment_methods', { headers })).json()
if (!Array.isArray(metodos)) { console.log('Erro ao consultar meios de pagamento:', metodos); process.exit(1) }
const pix = metodos.find((x) => x.id === 'pix')
console.log('Pix nesta conta:', pix ? `SIM (status: ${pix.status})` : 'NÃO — Pix não está habilitado para esta conta')
