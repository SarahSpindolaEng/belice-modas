// Mostra o status e o motivo de um pagamento do Mercado Pago.
// Uso: node consultar-pagamento.mjs NUMERO_DA_OPERACAO
import fs from 'fs'
const env = fs.readFileSync('.env.local', 'utf8')
const at = (env.match(/^MP_ACCESS_TOKEN=(.*)$/m)?.[1] ?? '').trim().replace(/^["']|["']$/g, '')
const id = (process.argv[2] ?? '').replace(/\D/g, '')
if (!id) { console.log('Informe o número da operação.'); process.exit(1) }
const p = await (await fetch(`https://api.mercadopago.com/v1/payments/${id}`, { headers: { Authorization: `Bearer ${at}` } })).json()
if (!p.id) { console.log('Não encontrado:', p.message ?? p); process.exit(1) }
console.log({
  operacao: p.id,
  status: p.status,
  motivo: p.status_detail,
  valor: p.transaction_amount,
  meio: `${p.payment_type_id} / ${p.payment_method_id}`,
  pagador_email: p.payer?.email,
  data: p.date_created,
})
