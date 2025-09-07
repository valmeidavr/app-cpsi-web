'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const login = async (login: string, password: string) => {
    try {
      const result = await signIn('credentials', {
        login,
        password,
        redirect: false,
      })

      if (result?.error) {
        throw new Error(result.error)
      }


      return result
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    await signOut({ redirect: false })
    router.push('/login')
  }

  const isAuthenticated = status === 'authenticated'
  const isLoading = status === 'loading'
  const isAdmin = session?.user?.role === 'Administrador'
  const hasSystemAccess = session?.user?.hasSystemAccess || false
  const userLevel = session?.user?.role || 'Usuario'



  return {
    session,
    status,
    isAuthenticated,
    isLoading,
    isAdmin,
    hasSystemAccess,
    userLevel,
    login,
    logout,
  }
} 