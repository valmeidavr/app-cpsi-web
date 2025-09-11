import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { redirect } from 'next/navigation'
export async function getSession() {
  return await getServerSession(authOptions)
}
export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    redirect('/login')
  }
  return session
}
export async function requireAdmin() {
  const session = await requireAuth()
  if (session.user.role !== 'admin') {
    redirect('/painel')
  }
  return session
}
export async function getCurrentUser() {
  const session = await getSession()
  return session?.user
} 