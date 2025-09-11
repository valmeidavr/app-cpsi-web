'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Database, CheckCircle, AlertTriangle, Info } from 'lucide-react'

export default function FixDatabasePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const fixDatabase = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/fix-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Database corrigido com sucesso!')
        setResult(data)
      } else {
        toast.error(data.error || 'Erro ao corrigir database')
        setResult(data)
      }
    } catch (error) {
      console.error('Erro ao executar correção:', error)
      toast.error('Erro ao executar correção do database')
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-6 w-6 text-blue-600" />
              Correção do Database - Tabela usuariogrupo
            </CardTitle>
            <CardDescription>
              Esta ferramenta corrige a estrutura da tabela usuariogrupo, alterando a primary key de 'admin' para 'id' e corrigindo campos problemáticos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-800">Importante</h3>
                    <p className="text-yellow-700 text-sm mt-1">
                      Esta operação fará backup automático dos dados existentes antes de alterar a estrutura da tabela.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-800">O que será feito:</h3>
                    <ul className="text-blue-700 text-sm mt-1 space-y-1">
                      <li>• Backup automático dos dados atuais</li>
                      <li>• Alteração da primary key de 'admin' para 'id'</li>
                      <li>• Remoção de campos problemáticos (usuario_id)</li>
                      <li>• Criação de índices otimizados</li>
                      <li>• Preservação de todos os dados existentes</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button 
                onClick={fixDatabase} 
                disabled={loading}
                size="lg"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Corrigindo Database...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Executar Correção do Database
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card className={`border-l-4 ${result.success ? 'border-l-green-500' : 'border-l-red-500'}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                )}
                Resultado da Correção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className={`p-3 rounded-md ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.success ? '✅ Sucesso!' : '❌ Erro!'}
                  </p>
                  <p className={`text-sm mt-1 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                    {result.message || result.error}
                  </p>
                </div>

                {result.success && result.stats && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <h4 className="font-medium text-gray-800 mb-2">Estatísticas:</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Ação executada: {result.action === 'created' ? 'Tabela criada' : 'Tabela corrigida'}</li>
                      {result.stats.originalRecords !== undefined && (
                        <li>• Registros originais: {result.stats.originalRecords}</li>
                      )}
                      {result.stats.migratedRecords !== undefined && (
                        <li>• Registros migrados: {result.stats.migratedRecords}</li>
                      )}
                      {result.stats.backupTable && (
                        <li>• Tabela de backup: {result.stats.backupTable}</li>
                      )}
                    </ul>
                  </div>
                )}

                {result.details && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <h4 className="font-medium text-gray-800 mb-2">Detalhes do erro:</h4>
                    <pre className="text-xs text-gray-600 bg-white p-2 rounded border overflow-x-auto">
                      {result.details}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {result?.success && (
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                Próximos Passos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>✅ Database corrigido com sucesso!</p>
                <p>🧪 <strong>Teste agora:</strong> Tente editar um usuário e configurar grupos de acesso</p>
                <p>🗄️ <strong>Backup disponível:</strong> Os dados originais foram salvos na tabela 'usuariogrupo_backup'</p>
                <p>🔍 <strong>Verificação:</strong> Os grupos de acesso devem funcionar corretamente na interface</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}