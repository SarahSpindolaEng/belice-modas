/**
 * Log de auditoria das ações administrativas (aceitar, negar, cancelar...).
 * Tabela criada automaticamente. Falha no log nunca derruba a ação.
 */
import sql from '@/lib/db'

let schemaReady: Promise<unknown> | null = null
function ensureSchema() {
  if (!schemaReady) {
    schemaReady = sql`
      CREATE TABLE IF NOT EXISTS admin_logs (
        id          bigserial PRIMARY KEY,
        created_at  timestamptz NOT NULL DEFAULT now(),
        admin_email text NOT NULL,
        acao        text NOT NULL,
        payment_id  text,
        ip          text,
        detalhes    jsonb
      )
    `.catch((err) => {
      schemaReady = null
      throw err
    })
  }
  return schemaReady
}

export async function logAdmin(entry: {
  adminEmail: string
  acao: string
  paymentId?: string | null
  ip?: string | null
  detalhes?: Record<string, unknown>
}) {
  try {
    await ensureSchema()
    await sql`
      INSERT INTO admin_logs (admin_email, acao, payment_id, ip, detalhes)
      VALUES (
        ${entry.adminEmail},
        ${entry.acao},
        ${entry.paymentId ?? null},
        ${entry.ip ?? null},
        ${entry.detalhes ? JSON.stringify(entry.detalhes) : null}
      )
    `
  } catch (err) {
    console.error('Falha ao gravar admin_logs:', err)
  }
}
