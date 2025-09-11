'use client'
import { SessionProvider } from 'next-auth/react'
import { ReactNode, Suspense } from 'react'
interface AuthProviderProps {
  children: ReactNode
}
export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider 
      refetchInterval={15 * 60}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
      basePath="/api/auth"
    >
      <Suspense fallback={<div>Carregando...</div>}>
        {children}
      </Suspense>
    </SessionProvider>
  )
} 