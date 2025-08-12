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

// Schema de validação
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

export default function EditarUsuario() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [usuario, setUsuario] = useState<any>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
      } catch (error) {
        console.error('Erro ao carregar usuário:', error)
        toast.error('Erro ao carregar usuário')
        router.push('/painel/usuarios')
      } finally {
        setFetching(false)
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
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error)
      toast.error(error.message || 'Erro ao atualizar usuário')
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
