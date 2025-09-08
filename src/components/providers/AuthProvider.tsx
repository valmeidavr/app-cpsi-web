'use client'
import { SessionProvider } from 'next-auth/react'
import { ReactNode, Suspense } from 'react'
interface AuthProviderProps {
  children: ReactNode
}
export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <Suspense fallback={<div>Carregando...</div>}>
        {children}
      </Suspense>
    </SessionProvider>
  )
} 