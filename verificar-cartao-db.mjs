// Procura no banco qualquer sequência com cara de número de cartão (13 a 19 dígitos).
// Não mostra os valores completos. Uso: node verificar-cartao-db.mjs
import fs from 'fs'
import { neon } from '@neondatabase/serverless'

const env = fs.readFileSync('.env.local', 'utf8')
const url = (env.match(/^DATABASE_URL=(.*)$/m)?.[1] ?? '').trim().replace(/^["']|["']$/g, '')
const sql = neon(url)

// Luhn: confirma se a sequência é um número de cartão válido
const luhn = (n) => {
  let s = 0, dbl = false
  for (let i = n.length - 1; i >= 0; i--) {
    let d = +n[i]
    if (dbl) { d *= 2; if (d > 9) d -= 9 }
    s += d; dbl = !dbl
  }
  return s % 10 === 0
}

const tabelas = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
console.log('Tabelas:', tabelas.map((t) => t.table_name).join(', '))

let achados = 0
for (const { table_name } of tabelas) {
  const linhas = await sql.query(`SELECT row_to_json(t)::text AS j FROM "${table_name}" t`)
  for (const { j } of linhas) {
    const seqs = (j.replace(/[ -](?=\d)/g, '').match(/\d{13,19}/g) ?? []).filter(luhn)
    for (const s of seqs) {
      // IDs de pagamento do Mercado Pago têm ~10-11 dígitos; 13+ com Luhn válido é suspeito
      achados++
      console.log(`⚠ ${table_name}: possível cartão ${s.slice(0, 4)}…${s.slice(-4)} (${s.length} dígitos)`)
    }
  }
  console.log(`${table_name}: ${linhas.length} linhas verificadas`)
}
console.log(achados ? `RESULTADO: ${achados} sequência(s) suspeita(s) — me mande este resultado.` : 'RESULTADO: nenhum número de cartão encontrado ✅')
