import { auth } from '.'
import { redirect } from 'next/navigation'

export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/auth/sign-in')
  }
  return session
}

export async function requireRole(role: 'admin' | 'user') {
  const session = await auth()
  if (!session?.user || session.user.role !== role) {
    redirect('/auth/sign-in')
  }
  return session
}
