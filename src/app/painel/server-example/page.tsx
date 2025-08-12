import { requireAuth, requireAdmin } from '@/lib/auth-utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ServerExamplePage() {
  // Esta função redireciona automaticamente se não estiver autenticado
  const session = await requireAuth()
  
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Página do Servidor - Exemplo</CardTitle>
          <CardDescription>
            Esta página usa autenticação no lado do servidor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Informações do Usuário (Servidor):</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p><strong>Nome:</strong> {session.user.name}</p>
              <p><strong>Email:</strong> {session.user.email}</p>
              <p><strong>ID:</strong> {session.user.id}</p>
              <p><strong>Função:</strong> {session.user.role}</p>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800">Autenticação no Servidor</h4>
            <p className="text-green-700">
              Esta página só é renderizada se o usuário estiver autenticado.
              A verificação acontece no servidor antes da renderização.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 