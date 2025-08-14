'use client'

import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ProtectedExamplePage() {
  const { session, isAuthenticated, isAdmin, logout } = useAuth()

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Você precisa estar logado para acessar esta página.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Página Protegida - Exemplo</CardTitle>
          <CardDescription>
            Esta página só pode ser acessada por usuários autenticados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Informações do Usuário:</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p><strong>Nome:</strong> {session?.user?.name}</p>
              <p><strong>Email:</strong> {session?.user?.email}</p>
              <p><strong>ID:</strong> {session?.user?.id}</p>
              <p><strong>Função:</strong> {session?.user?.role}</p>
              <p><strong>É Admin:</strong> {isAdmin ? 'Sim' : 'Não'}</p>
            </div>
          </div>
          
          {isAdmin && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800">Área de Administrador</h4>
              <p className="text-blue-700">
                Você tem acesso a funcionalidades administrativas.
              </p>
            </div>
          )}
          
          <div className="flex gap-4">
            <Button onClick={logout} variant="outline">
              Sair
            </Button>
            <Button onClick={() => window.history.back()}>
              Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 