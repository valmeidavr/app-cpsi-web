'use client'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { toast } from 'sonner'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { Save, Loader2, Eye, EyeOff, Users } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
const createUsuarioSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmedsenha: z.string()
}).refine((data) => data.senha === data.confirmedsenha, {
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
export default function UsuarioRegistrationForm() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [sistemas, setSistemas] = useState<Sistema[]>([])
  const [loadingSistemas, setLoadingSistemas] = useState(true)
  const router = useRouter()
  const form = useForm({
    resolver: zodResolver(createUsuarioSchema),
    defaultValues: {
      nome: '',
      email: '',
      senha: '',
      confirmedsenha: ''
    }
  })
  useEffect(() => {
    const carregarSistemas = async () => {
      try {
        const response = await fetch('/api/usuarios/sistemas')
        if (response.ok) {
          const sistemasData = await response.json()
          setSistemas(sistemasData.sistemas || [])
        }
      } catch (error) {
        toast.error('Erro ao carregar sistemas')
      } finally {
        setLoadingSistemas(false)
      }
    }
    carregarSistemas()
  }, [])

  const handleGroupChange = (sistemaId: number, grupoId: number | null) => {
    setSistemas(prev => prev.map(sistema => 
      sistema.sistemaId === sistemaId 
        ? { ...sistema, grupoSelecionado: grupoId }
        : sistema
    ))
  }
  const onSubmit = async (values: z.infer<typeof createUsuarioSchema>) => {
    setLoading(true)
    try {
      // Primeiro, criar o usuário
      const response = await fetch('/api/usuarios/criar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar usuário')
      }

      const userData = await response.json()

      // Depois, configurar os grupos de acesso
      const sistemasResponse = await fetch('/api/usuarios/sistemas', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData.login, // Usar o login retornado
          sistemas: sistemas
        })
      })

      if (!sistemasResponse.ok) {
        const errorData = await sistemasResponse.json()
        // Não falha aqui, apenas avisa
      }

      toast.success('Usuário criado com sucesso!')
      router.push('/painel/usuarios?type=success&message=Usuário criado com sucesso!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar usuário')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="container mx-auto p-6">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Usuários", href: "/painel/usuarios" },
          { label: "Novo Usuário" },
        ]}
      />
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Novo Usuário</CardTitle>
          <CardDescription>
            Preencha os dados para criar um novo usuário no sistema
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
                    <FormLabel>Senha *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          {...field}
                          placeholder="Digite a senha"
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
                    <FormLabel>Confirmar Senha *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          {...field}
                          placeholder="Confirme a senha"
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
                      Criando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Criar Usuário
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