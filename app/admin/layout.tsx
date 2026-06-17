import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { isAdmin } from '@/lib/admin-emails'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user?.email) {
    redirect('/login?callbackUrl=/admin/pedidos')
  }

  if (!isAdmin(session.user.email)) {
    redirect('/')
  }

  return <>{children}</>
}
