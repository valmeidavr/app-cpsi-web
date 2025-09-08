'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { Loader2, Save, Users } from 'lucide-react'
interface Sistema {
  id: number
  nome: string
}
interface UsuarioSistema {
  [key: number]: {
    nivel: string
    sistema_nome: string
  }
}
interface Usuario {
  login: string
  nome: string
  email: string
}
export default function GerenciarAcessoPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [sistemas, setSistemas] = useState<Sistema[]>([])
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [userAccess, setUserAccess] = useState<UsuarioSistema>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [accessConfig, setAccessConfig] = useState<{[key: number]: {hasAccess: boolean, nivel: string}}>({})
  useEffect(() => {
    fetchSistemas()
  }, [])
  const handleSearchChange = (value: string) => {
    console.log('🔍 Debug - handleSearchChange chamado com:', value, 'length:', value.length)
    setSearchValue(value)
    if (searchTimeout) {
      clearTimeout(searchTimeout)
      console.log('🔍 Debug - Timeout anterior limpo')
    }
    if (value.length >= 3) {
      console.log('🔍 Debug - Configurando timeout para buscar usuários')
      const timeout = setTimeout(() => {
        console.log('🔍 Debug - Timeout executado, buscando usuários com:', value)
        fetchUsuarios(value)
      }, 300)
      setSearchTimeout(timeout)
    } else {
      console.log('🔍 Debug - Limpando lista de usuários (menos de 3 caracteres)')
      setUsuarios([])
    }
  }
  const fetchSistemas = async () => {
    try {
      const response = await fetch('/api/usuarios/sistemas')
      if (response.ok) {
        const data = await response.json()
        setSistemas(data)
        const initialConfig = data.reduce((acc: Record<number, { hasAccess: boolean; nivel: string }>, sistema: Sistema) => {
          acc[sistema.id] = { hasAccess: false, nivel: 'Usuario' }
          return acc
        }, {} as Record<number, { hasAccess: boolean; nivel: string }>)
        setAccessConfig(initialConfig)
      }
    } catch (error) {
      console.error('Erro ao buscar sistemas:', error)
      toast.error('Erro ao carregar sistemas')
    }
  }
  const fetchUsuarios = async (search: string) => {
    try {
      const url = `/api/usuarios?search=${encodeURIComponent(search)}&limit=1000`
      console.log('🔍 Debug - Fazendo fetch para:', url)
      const response = await fetch(url)
      console.log('🔍 Debug - Response status:', response.status)
      console.log('🔍 Debug - Response headers:', response.headers)
      if (response.ok) {
        const data = await response.json()
        console.log('🔍 Debug - Dados recebidos:', data)
        console.log('🔍 Debug - Tipo de data:', typeof data)
        console.log('🔍 Debug - Data.data existe?', !!data.data)
        console.log('🔍 Debug - Data.data é array?', Array.isArray(data.data))
        if (data.data && Array.isArray(data.data)) {
          setUsuarios(data.data)
          console.log('🔍 Debug - Usuários definidos:', data.data.length)
        } else if (Array.isArray(data)) {
          setUsuarios(data)
          console.log('🔍 Debug - Usuários definidos (array direto):', data.length)
        } else {
          console.error('🔍 Debug - Formato de dados inesperado:', data)
          setUsuarios([])
        }
      } else {
        console.error('🔍 Debug - Erro na resposta:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('🔍 Debug - Texto do erro:', errorText)
      }
    } catch (error) {
      console.error('🔍 Debug - Erro ao buscar usuários:', error)
      toast.error('Erro ao carregar usuários')
    }
  }
  const handleUserChange = async (userId: string) => {
    if (!userId) {
      setUserAccess({})
      setAccessConfig({})
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/api/usuarios/sistemas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })
      if (response.ok) {
        const data = await response.json()
        setUserAccess(data.userAccess)
        const newConfig = sistemas.reduce((acc: Record<number, { hasAccess: boolean; nivel: string }>, sistema: Sistema) => {
          const userAccessInfo = data.userAccess[sistema.id]
          acc[sistema.id] = {
            hasAccess: !!userAccessInfo,
            nivel: userAccessInfo?.nivel || 'Usuario'
          }
          return acc
        }, {} as Record<number, { hasAccess: boolean; nivel: string }>)
        setAccessConfig(newConfig)
      }
    } catch (error) {
                        const data = await response.json();
                        toast.success('Teste de busca executado. Veja o console.');
                      } catch (error) {
                        toast.error('Erro ao testar busca');
                      }
                    }}
                  >
                    Testar
                  </Button>
                  {searchValue.length >= 3 && usuarios.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto z-10">
                      {usuarios.map((usuario) => (
                        <div
                          key={usuario.login}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => {
                            setSelectedUser(usuario.login)
                            handleUserChange(usuario.login)
                            setSearchValue('')
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{usuario.nome}</span>
                            <span className="text-sm text-gray-500">{usuario.email}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchValue.length > 0 && searchValue.length < 3 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg p-3 text-sm text-gray-500">
                      Digite pelo menos 3 caracteres para buscar usuários
                    </div>
                  )}
                  {searchValue.length >= 3 && usuarios.length === 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg p-3 text-sm text-gray-500">
                      Nenhum usuário encontrado
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        {}
        {selectedUser && (
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Acesso</CardTitle>
              <CardDescription>
                Configure o acesso do usuário aos sistemas e seus níveis de permissão
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Carregando acesso do usuário...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {sistemas.map((sistema) => (
                    <div key={sistema.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`sistema-${sistema.id}`}
                          checked={accessConfig[sistema.id]?.hasAccess || false}
                          onCheckedChange={(checked) => 
                            handleAccessChange(sistema.id, checked as boolean)
                          }
                        />
                        <Label htmlFor={`sistema-${sistema.id}`} className="font-medium">
                          {sistema.nome}
                        </Label>
                      </div>
                      {accessConfig[sistema.id]?.hasAccess && (
                        <div className="ml-4">
                          <Label htmlFor={`nivel-${sistema.id}`}>Nível:</Label>
                          <Select
                            value={accessConfig[sistema.id]?.nivel || 'Usuario'}
                            onValueChange={(value) => handleLevelChange(sistema.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Usuario">Usuário</SelectItem>
                              <SelectItem value="Gestor">Gestor</SelectItem>
                              <SelectItem value="Administrador">Administrador</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Salvar Alterações
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 