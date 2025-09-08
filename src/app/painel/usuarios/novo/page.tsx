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
import { Save, Loader2, Eye, EyeOff } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
const createUsuarioSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmedsenha: z.string(),
  grupos: z.array(z.number()).min(1, 'Selecione pelo menos um grupo')
}).refine((data) => data.senha === data.confirmedsenha, {
  message: 'As senhas não coincidem',
  path: ['confirmedsenha']
})
interface Grupo {
  id: number
  nome: string
}
export default function UsuarioRegistrationForm() {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [loadingGrupos, setLoadingGrupos] = useState(true)
  const router = useRouter()
  const form = useForm({
    resolver: zodResolver(createUsuarioSchema),
    defaultValues: {
      nome: '',
      email: '',
      senha: '',
      confirmedsenha: '',
      grupos: []
    }
  })
  useEffect(() => {
    const carregarGrupos = async () => {
      try {
        const response = await fetch('/api/usuarios/sistemas')
        if (response.ok) {
          const gruposData = await response.json()
          setGrupos(gruposData)
        }
      } catch (error) {
        console.error('Erro ao carregar grupos:', error)
        toast.error('Erro ao carregar grupos')
      } finally {
        setLoadingGrupos(false)
      }
    }
    carregarGrupos()
  }, [])
  const onSubmit = async (values: z.infer<typeof createUsuarioSchema>) => {
    setLoading(true)
    try {
      const response = await fetch('/api/usuarios/criar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })
      if (response.ok) {
        toast.success('Usuário criado com sucesso!')
        router.push('/painel/usuarios?type=success&message=Usuário criado com sucesso!')
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar usuário')
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
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