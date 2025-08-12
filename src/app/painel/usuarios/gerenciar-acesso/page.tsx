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

  // Estados para controle dos checkboxes e níveis
  const [accessConfig, setAccessConfig] = useState<{[key: number]: {hasAccess: boolean, nivel: string}}>({})

  useEffect(() => {
    fetchSistemas()
    // Não carrega usuários no início
  }, [])

  // Função para buscar usuários quando digitar
  const handleSearchChange = (value: string) => {
    console.log('handleSearchChange chamado com:', value, 'length:', value.length)
    setSearchValue(value)
    
    // Limpar timeout anterior
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    if (value.length >= 3) {
      // Debounce de 300ms
      const timeout = setTimeout(() => {
        console.log('Buscando usuários com:', value)
        fetchUsuarios(value)
      }, 300)
      setSearchTimeout(timeout)
    } else {
      // Limpa a lista se tem menos de 3 caracteres
      console.log('Limpando lista de usuários')
      setUsuarios([])
    }
  }

  const fetchSistemas = async () => {
    try {
      const response = await fetch('/api/usuarios/sistemas')
      if (response.ok) {
        const data = await response.json()
        setSistemas(data)
        
        // Inicializar configuração de acesso
        const initialConfig = data.reduce((acc: any, sistema: Sistema) => {
          acc[sistema.id] = { hasAccess: false, nivel: 'Usuario' }
          return acc
        }, {})
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
      console.log('Fazendo fetch para:', url)
      
      const response = await fetch(url)
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Dados recebidos:', data)
        setUsuarios(data.data || data)
      } else {
        console.error('Erro na resposta:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
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
        
        // Atualizar configuração de acesso
        const newConfig = sistemas.reduce((acc: any, sistema: Sistema) => {
          const userAccessInfo = data.userAccess[sistema.id]
          acc[sistema.id] = {
            hasAccess: !!userAccessInfo,
            nivel: userAccessInfo?.nivel || 'Usuario'
          }
          return acc
        }, {})
        setAccessConfig(newConfig)
      }
    } catch (error) {
      console.error('Erro ao buscar acesso do usuário:', error)
      toast.error('Erro ao carregar acesso do usuário')
    } finally {
      setLoading(false)
    }
  }

  const handleAccessChange = (sistemaId: number, hasAccess: boolean) => {
    setAccessConfig(prev => ({
      ...prev,
      [sistemaId]: {
        ...prev[sistemaId],
        hasAccess
      }
    }))
  }

  const handleLevelChange = (sistemaId: number, nivel: string) => {
    setAccessConfig(prev => ({
      ...prev,
      [sistemaId]: {
        ...prev[sistemaId],
        nivel
      }
    }))
  }

  const handleSave = async () => {
    if (!selectedUser) {
      toast.error('Selecione um usuário')
      return
    }

    setSaving(true)
    try {
      const sistemasToUpdate = sistemas.map(sistema => ({
        id: sistema.id,
        hasAccess: accessConfig[sistema.id]?.hasAccess || false,
        nivel: accessConfig[sistema.id]?.nivel || 'Usuario'
      }))

      const response = await fetch('/api/usuarios/sistemas', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser,
          sistemas: sistemasToUpdate
        }),
      })

      if (response.ok) {
        toast.success('Acesso do usuário atualizado com sucesso!')
        // Recarregar dados do usuário
        handleUserChange(selectedUser)
      } else {
        throw new Error('Erro ao atualizar acesso')
      }
    } catch (error) {
      console.error('Erro ao salvar acesso:', error)
      toast.error('Erro ao salvar acesso do usuário')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Usuários", href: "/painel/usuarios" },
          { label: "Gerenciar Acesso" },
        ]}
      />

      <div className="flex items-center gap-2 mb-6">
        <Users className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Gerenciar Acesso dos Usuários</h1>
      </div>

      <div className="grid gap-6">
        {/* Seleção de Usuário */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Usuário</CardTitle>
            <CardDescription>
              Escolha um usuário para gerenciar seu acesso aos sistemas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="user-select">Usuário</Label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Digite o nome ou email do usuário..."
                    value={searchValue}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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

        {/* Configuração de Acesso */}
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