// Lista os últimos pagamentos da conta Mercado Pago da loja, com status e motivo.
// Uso: node listar-pagamentos.mjs
import fs from 'fs'
const env = fs.readFileSync('.env.local', 'utf8')
const at = (env.match(/^MP_ACCESS_TOKEN=(.*)$/m)?.[1] ?? '').trim().replace(/^["']|["']$/g, '')
const r = await (await fetch('https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&limit=30', {
  headers: { Authorization: `Bearer ${at}` },
})).json()
if (!Array.isArray(r.results)) { console.log('Erro:', r.message ?? r); process.exit(1) }
const resumo = {}
for (const p of r.results) {
  const k = `${p.status} / ${p.status_detail}`
  resumo[k] = (resumo[k] ?? 0) + 1
  console.log(`${p.date_created?.slice(0, 16)}  #${p.id}  R$ ${p.transaction_amount}  ${p.payment_method_id}  ${p.status} (${p.status_detail})`)
}
console.log('\nResumo:', resumo)
