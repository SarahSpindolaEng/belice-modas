// Emails admin — lê do env, fallback hardcoded para evitar lockout se env estiver vazio no Vercel
const FALLBACK = ['belicemodas6@gmail.com', 'sarahgiulia2005@gmail.com']

export function getAdminEmails(): string[] {
  const fromEnv = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return fromEnv.length > 0 ? fromEnv : FALLBACK
}

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  return getAdminEmails().includes(email.toLowerCase())
}
