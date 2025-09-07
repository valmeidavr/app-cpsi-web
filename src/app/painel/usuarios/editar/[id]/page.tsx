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
import { Save, Loader2, Eye, EyeOff } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

// Schema de validação
const updateUsuarioSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  senha: z.string().optional(),
  confirmedsenha: z.string().optional(),
  grupos: z.array(z.number()).min(1, 'Selecione pelo menos um grupo')
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
}

export default function EditarUsuario() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [usuario, setUsuario] = useState<{ nome: string; email: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [loadingGrupos, setLoadingGrupos] = useState(true)
  const params = useParams()
  const router = useRouter()
  const userId = Array.isArray(params.id) ? params.id[0] : params.id

  const form = useForm({
    resolver: zodResolver(updateUsuarioSchema),
    defaultValues: {
      nome: '',
      email: '',
      senha: '',
      confirmedsenha: '',
      grupos: []
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
        
        // Carregar dados do usuário
        const response = await fetch(`/api/usuarios/editar/${userId}`)
        
        if (response.ok) {
          const data = await response.json()
          setUsuario(data)
          form.reset({
            nome: data.nome,
            email: data.email,
            senha: '',
            confirmedsenha: '',
            grupos: data.sistemas?.map((s: any) => s.id) || []
          })
        } else {
          toast.error('Usuário não encontrado')
          router.push('/painel/usuarios')
        }

        // Carregar grupos disponíveis
        const gruposResponse = await fetch('/api/usuarios/sistemas')
        if (gruposResponse.ok) {
          const gruposData = await gruposResponse.json()
          setGrupos(gruposData)
        }

        // Carregar grupos do usuário
        const userGruposResponse = await fetch('/api/usuarios/sistemas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        })
        
        if (userGruposResponse.ok) {
          const userGruposData = await userGruposResponse.json()
          form.setValue('grupos', userGruposData.userGroups || [])
        }
        
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        toast.error('Erro ao carregar dados')
        router.push('/painel/usuarios')
      } finally {
        setFetching(false)
        setLoadingGrupos(false)
      }
    }

    fetchData()
  }, [userId, form, router])

  const onSubmit = async (values: z.infer<typeof updateUsuarioSchema>) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/usuarios/editar/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      if (response.ok) {
        toast.success('Usuário atualizado com sucesso!')
        router.push('/painel/usuarios?type=success&message=Usuário atualizado com sucesso!')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao atualizar usuário')
      }
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
              {/* Nome */}
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

              {/* Email */}
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

              {/* Senha */}
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

              {/* Confirmar Senha */}
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

              {/* Seleção de Grupos */}
              <FormField
                control={form.control}
                name="grupos"
                render={() => (
                  <FormItem>
                    <FormLabel>Grupos de Acesso *</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        {loadingGrupos ? (
                          <div className="text-sm text-gray-500">Carregando grupos...</div>
                        ) : (
                          grupos.map((grupo) => (
                            <div key={grupo.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`grupo-${grupo.id}`}
                                checked={form.watch('grupos').includes(grupo.id)}
                                onCheckedChange={(checked) => {
                                  const currentGrupos = form.getValues('grupos')
                                  if (checked) {
                                    form.setValue('grupos', [...currentGrupos, grupo.id])
                                  } else {
                                    form.setValue('grupos', currentGrupos.filter(id => id !== grupo.id))
                                  }
                                }}
                              />
                              <Label htmlFor={`grupo-${grupo.id}`} className="text-sm font-medium">
                                {grupo.nome}
                              </Label>
                            </div>
                          ))
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Botões */}
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
