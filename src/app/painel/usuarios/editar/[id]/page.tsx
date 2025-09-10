'use client'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams, useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { toast } from 'sonner'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { Save, Loader2, Eye, EyeOff, Users } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
const updateUsuarioSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  senha: z.string().optional(),
  confirmedsenha: z.string().optional()
}).refine((data) => {
  if (data.senha && !data.confirmedsenha) {
    return false
  }
  if (data.confirmedsenha && !data.senha) {
    return false
  }
  if (data.senha && data.confirmedsenha && data.senha !== data.confirmedsenha) {
    return false
  }
  return true
}, {
  message: 'As senhas não coincidem',
  path: ['confirmedsenha']
})

interface Grupo {
  id: number
  nome: string
  selected?: boolean
}

interface Sistema {
  sistemaId: number
  sistema_nome: string
  grupos: Grupo[]
  grupoSelecionado: number | null
}
export default function EditarUsuario() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [usuario, setUsuario] = useState<{ nome: string; email: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [sistemas, setSistemas] = useState<Sistema[]>([])
  const [loadingSistemas, setLoadingSistemas] = useState(true)
  const params = useParams()
  const router = useRouter()
  const userId = Array.isArray(params.id) ? params.id[0] : params.id
  const form = useForm({
    resolver: zodResolver(updateUsuarioSchema),
    defaultValues: {
      nome: '',
      email: '',
      senha: '',
      confirmedsenha: ''
    }
  })
  useEffect(() => {
    async function fetchData() {
      if (!userId) {
        router.push('/painel/usuarios')
        return
      }
      try {
        setFetching(true)
        const response = await fetch(`/api/usuarios/editar/${userId}`)
        if (response.ok) {
          const data = await response.json()
          setUsuario(data)
          form.reset({
            nome: data.nome,
            email: data.email,
            senha: '',
            confirmedsenha: ''
          })
        } else {
          toast.error('Usuário não encontrado')
          router.push('/painel/usuarios')
        }

        // Carregar sistemas com grupos do usuário
        const sistemasResponse = await fetch('/api/usuarios/sistemas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        })
        if (sistemasResponse.ok) {
          const sistemasData = await sistemasResponse.json()
          setSistemas(sistemasData.sistemas || [])
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        toast.error('Erro ao carregar dados')
        router.push('/painel/usuarios')
      } finally {
        setFetching(false)
        setLoadingSistemas(false)
      }
    }
    fetchData()
  }, [userId, form, router])
  const handleGroupChange = (sistemaId: number, grupoId: number | null) => {
    setSistemas(prev => prev.map(sistema => 
      sistema.sistemaId === sistemaId 
        ? { ...sistema, grupoSelecionado: grupoId }
        : sistema
    ))
  }

  const onSubmit = async (values: z.infer<typeof updateUsuarioSchema>) => {
    setLoading(true)
    try {
      // Primeiro, atualizar dados do usuário
      const response = await fetch(`/api/usuarios/editar/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar usuário')
      }

      // Depois, atualizar grupos de acesso
      const sistemasResponse = await fetch('/api/usuarios/sistemas', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          sistemas: sistemas
        })
      })

      if (!sistemasResponse.ok) {
        const errorData = await sistemasResponse.json()
        throw new Error(errorData.error || 'Erro ao atualizar grupos de acesso')
      }

      toast.success('Usuário atualizado com sucesso!')
      router.push('/painel/usuarios?type=success&message=Usuário atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar usuário')
    } finally {
      setLoading(false)
    }
  }
  if (fetching) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center w-full h-40">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Carregando usuário...</span>
        </div>
      </div>
    )
  }
  return (
    <div className="container mx-auto p-6">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Usuários", href: "/painel/usuarios" },
          { label: "Editar Usuário" },
        ]}
      />
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Editar Usuário</CardTitle>
          <CardDescription>
            Atualize os dados do usuário {usuario?.nome}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {}
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Digite o nome completo"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        {...field}
                        placeholder="Digite o email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {}
              <FormField
                control={form.control}
                name="senha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nova Senha (opcional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          {...field}
                          placeholder="Deixe em branco para manter a senha atual"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {}
              <FormField
                control={form.control}
                name="confirmedsenha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar Nova Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          {...field}
                          placeholder="Confirme a nova senha"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Grupos de Acesso</h3>
                {loadingSistemas ? (
                  <div className="text-sm text-gray-500">Carregando sistemas...</div>
                ) : (
                  sistemas.map((sistema) => (
                    <Card key={sistema.sistemaId} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Users className="h-5 w-5 text-blue-600" />
                          {sistema.sistema_nome}
                        </CardTitle>
                        <CardDescription>
                          Selecione um grupo para este sistema (máximo 1 por sistema)
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-50">
                            <input
                              type="radio"
                              id={`sistema-${sistema.sistemaId}-none`}
                              name={`sistema-${sistema.sistemaId}`}
                              checked={sistema.grupoSelecionado === null}
                              onChange={() => handleGroupChange(sistema.sistemaId, null)}
                              className="w-4 h-4 text-blue-600"
                            />
                            <Label 
                              htmlFor={`sistema-${sistema.sistemaId}-none`} 
                              className="text-sm text-gray-600 cursor-pointer"
                            >
                              Sem acesso
                            </Label>
                          </div>
                          
                          {sistema.grupos.map((grupo) => (
                            <div key={grupo.id} className="flex items-center gap-2 p-2 border rounded-md hover:bg-gray-50 transition-colors">
                              <input
                                type="radio"
                                id={`grupo-${grupo.id}`}
                                name={`sistema-${sistema.sistemaId}`}
                                checked={sistema.grupoSelecionado === grupo.id}
                                onChange={() => handleGroupChange(sistema.sistemaId, grupo.id)}
                                className="w-4 h-4 text-blue-600"
                              />
                              <Label 
                                htmlFor={`grupo-${grupo.id}`} 
                                className="font-medium cursor-pointer flex-1"
                              >
                                {grupo.nome}
                              </Label>
                            </div>
                          ))}
                          
                          {sistema.grupos.length === 0 && (
                            <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded-md">
                              Nenhum grupo disponível para este sistema
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
              {}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
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
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}