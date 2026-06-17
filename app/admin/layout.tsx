import { redirect } from 'next/navigation'
import { auth } from '@/auth'

// Fallback hardcoded — garante acesso mesmo se ADMIN_EMAILS não estiver no Vercel
const FALLBACK_ADMINS = ['belicemodas6@gmail.com', 'sarahgiulia2005@gmail.com']

function getAdminEmails(): string[] {
  const fromEnv = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return fromEnv.length > 0 ? fromEnv : FALLBACK_ADMINS
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/login?callbackUrl=/admin/pedidos')
  }

  const adminEmails = getAdminEmails()
  if (!adminEmails.includes(session.user.email.toLowerCase())) {
    redirect('/')
  }

  return <>{children}</>
}
