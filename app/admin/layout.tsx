import { redirect } from 'next/navigation'
import { auth } from '@/auth'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())

// Segunda camada de segurança (middleware é a primeira).
// Server component — roda no servidor antes de qualquer HTML ser enviado.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/login?callbackUrl=/admin/pedidos')
  }

  if (!ADMIN_EMAILS.includes(session.user.email.toLowerCase())) {
    redirect('/')
  }

  return <>{children}</>
}
