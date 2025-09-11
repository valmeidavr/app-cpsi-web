'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import Breadcrumb from '@/components/ui/Breadcrumb'
import { Plus, Edit, Trash2, Users } from 'lucide-react'
interface Grupo {
  id: number
  nome: string
  descricao?: string
  usuariosCount?: number
}
export default function GruposPage() {
  const [grupos, setGrupos] = useState<Grupo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingGrupo, setEditingGrupo] = useState<Grupo | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    descricao: ''
  })
  const carregarGrupos = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/grupos')
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Erro ${response.status}: ${errorData.error || 'Erro desconhecido'}`)
      }
      
      const gruposData = await response.json()
      
      // Calcular contagem de usuários para cada grupo
      const gruposComContagem = await Promise.all(
        gruposData.map(async (grupo: Grupo) => {
          try {
            // Buscar usuários associados ao grupo na tabela usuario_grupo
            const countResponse = await fetch(`/api/grupos/${grupo.id}/usuarios`)
            let usuariosCount = 0
            
            if (countResponse.ok) {
              const countData = await countResponse.json()
              usuariosCount = countData.total || 0
            }
            
            return { ...grupo, usuariosCount }
          } catch (error) {
            return { ...grupo, usuariosCount: 0 }
          }
        })
      )
      
      setGrupos(gruposComContagem)
    } catch (error) {
      toast.error(`Erro ao carregar grupos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    carregarGrupos()
  }, [])
  const gruposFiltrados = grupos.filter(grupo =>
    grupo.nome.toLowerCase().includes(search.toLowerCase())
  )
  const abrirDialog = (grupo?: Grupo) => {
    if (grupo) {
      setEditingGrupo(grupo)
      setFormData({
        nome: grupo.nome,
        descricao: grupo.descricao || ''
      })
    } else {
      setEditingGrupo(null)
      setFormData({
        nome: '',
        descricao: ''
      })
    }
    setIsDialogOpen(true)
  }
  const salvarGrupo = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome do grupo é obrigatório')
      return
    }
    
    try {
      
      let response
      if (editingGrupo) {
        // Atualizar grupo existente
        response = await fetch(`/api/grupos/${editingGrupo.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nome: formData.nome.trim(),
            descricao: formData.descricao.trim() || null
          })
        })
      } else {
        // Criar novo grupo
        response = await fetch('/api/grupos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nome: formData.nome.trim(),
            descricao: formData.descricao.trim() || null
          })
        })
      }
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro desconhecido')
      }
      
      const resultado = await response.json()
      
      toast.success(editingGrupo ? 'Grupo atualizado com sucesso!' : 'Grupo criado com sucesso!')
      setIsDialogOpen(false)
      
      // Limpar formulário
      setFormData({ nome: '', descricao: '' })
      setEditingGrupo(null)
      
      // Recarregar lista
      carregarGrupos()
    } catch (error) {
      toast.error(`Erro ao salvar grupo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }
  const deletarGrupo = async (grupo: Grupo) => {
    const confirmacao = confirm(
      `Tem certeza que deseja deletar o grupo "${grupo.nome}"?\n\n` +
      `Esta ação não pode ser desfeita e removerá o grupo permanentemente do sistema.`
    )
    
    if (!confirmacao) {
      return
    }
    
    try {
      
      const response = await fetch(`/api/grupos/${grupo.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro desconhecido')
      }
      
      const resultado = await response.json()
      
      toast.success('Grupo deletado com sucesso!')
      carregarGrupos() // Recarregar lista
    } catch (error) {
      toast.error(`Erro ao deletar grupo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }
  return (
    <div className="container mx-auto p-6">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Grupos" },
        ]}
      />
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Grupos</h1>
          <p className="text-gray-600">Gerencie os grupos de acesso do sistema</p>
        </div>
        <Button onClick={() => abrirDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Grupo
        </Button>
      </div>
      {}
      <div className="mb-6">
        <Input
          placeholder="Buscar grupos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>
      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-8">
            <div className="text-gray-500">Carregando grupos...</div>
          </div>
        ) : gruposFiltrados.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <div className="text-gray-500">
              {search ? 'Nenhum grupo encontrado' : 'Nenhum grupo cadastrado'}
            </div>
          </div>
        ) : (
          gruposFiltrados.map((grupo) => (
            <Card key={grupo.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{grupo.nome}</CardTitle>
                    <CardDescription>
                      {grupo.descricao || 'Sem descrição'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => abrirDialog(grupo)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletarGrupo(grupo)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  {grupo.usuariosCount || 0} usuários
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      {}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGrupo ? 'Editar Grupo' : 'Novo Grupo'}
            </DialogTitle>
            <DialogDescription>
              {editingGrupo 
                ? 'Atualize as informações do grupo' 
                : 'Preencha as informações para criar um novo grupo'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome do Grupo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Digite o nome do grupo"
              />
            </div>
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Digite uma descrição (opcional)"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={salvarGrupo}>
                {editingGrupo ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}