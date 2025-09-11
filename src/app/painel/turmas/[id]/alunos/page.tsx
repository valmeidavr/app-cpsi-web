"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
// Função para obter data atual no formato YYYY-MM-DD
const getCurrentDateString = () => {
  return new Date().toISOString().split('T')[0];
};
import { Cliente } from "@/app/types/Cliente";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Aluno } from "@/app/types/Aluno";
import { formatDate } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatarTelefone } from "@/util/clearData";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2, MenuIcon, Search, Trash2, Plus, Users, UserPlus, GraduationCap, ArrowLeft } from "lucide-react";
import { http } from "@/util/http";
import { useParams, useRouter } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AlunoDetalhesModal from "../../_components/detalhesAlunoModal";

export default function GerenciarAlunosTurma() {
  const params = useParams();
  const router = useRouter();
  const turmaId = Array.isArray(params.id) ? parseInt(params.id[0]) : parseInt(params.id);
  
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingAluno, setLoadingAluno] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [termoBusca, setTermoBusca] = useState("");
  const [termoBuscaAluno, setTermoBuscaAluno] = useState("");
  const [isModalDeleteAllOpen, setisModalDeleteAllOpen] = useState(false);
  const [isModalDeleteOpen, setisModalDeleteOpen] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [isDetalhesOpen, setIsDetalhesOpen] = useState(false);
  const [loadingDeleteAll, setLoadingDeleteAll] = useState(false);
  const [nomeTurma, setNomeTurma] = useState("");

  const carregarDadosTurma = async () => {
    try {
      const { data } = await http.get(`/api/turmas/${turmaId}`);
      setNomeTurma(data.nome);
    } catch (error) {
      toast.error("Erro ao carregar dados da turma");
    }
  };

  const carregarClientes = async () => {
    try {
      setLoading(true);
      const { data } = await http.get("/api/clientes", {
        params: {
          page: paginaAtual + 1,
          limit: 10,
          search: termoBusca,
        },
      });
      setClientes(data.data);
    } catch (error) {
      toast.error("Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  };

  const deleteAllAlunos = async () => {
    try {
      setLoadingDeleteAll(true);
      await http.delete(`/api/alunos_turmas/${turmaId}?deleteAll=true`);
      await carregarAlunos();
      toast.success("Todos os alunos foram removidos da turma");
    } catch (error) {
      toast.error("Erro ao remover alunos");
    } finally {
      setLoadingDeleteAll(false);
    }
  };

  const addAluno = async (cliente_id: number, turma_id: number) => {
    try {
      setLoadingAluno(true);
      const { data: turma } = await http.get(`/api/turmas/${turmaId}`);
      if (alunos.length >= turma.limite_vagas) {
        throw new Error("Turma está lotada");
      }
      const payload = {
        cliente_id,
        turma_id,
        data_inscricao: getCurrentDateString(),
      };
      await http.post("/api/alunos_turmas", payload);
      await carregarAlunos();
      toast.success("Aluno adicionado com sucesso!");
    } catch (error) {
      toast.error(`Erro ao adicionar aluno: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoadingAluno(false);
    }
  };

  const excluirAluno = async (alunoId: number) => {
    try {
      setLoadingAluno(true);
      await http.delete(`/api/alunos_turmas/${alunoId}`);
      await carregarAlunos();
      toast.success("Aluno removido da turma com sucesso!");
    } catch (error) {
      toast.error("Erro ao remover aluno");
    } finally {
      setLoadingAluno(false);
    }
  };

  const carregarAlunos = async () => {
    try {
      setLoadingAluno(true);
      const { data } = await http.get(
        "/api/alunos_turmas",
        {
          params: {
            page: paginaAtual + 1,
            limit: 10,
            search: termoBuscaAluno,
            turmaId: turmaId,
          },
        }
      );
      setAlunos(data.data);
    } catch (error) {
      toast.error("Erro ao carregar alunos");
    } finally {
      setLoadingAluno(false);
    }
  };

  useEffect(() => {
    if (turmaId) {
      carregarDadosTurma();
      carregarAlunos();
      carregarClientes();
    }
  }, [turmaId, paginaAtual]);

  const handleSearch = () => {
    setPaginaAtual(0);
    carregarClientes();
  };

  const handleSearchAluno = () => {
    setPaginaAtual(0);
    carregarAlunos();
  };

  return (
    <div className="container mx-auto p-6">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Turmas", href: "/painel/turmas" },
          { label: `Alunos - ${nomeTurma}` },
        ]}
      />
      
      <div className="flex items-center gap-4 mb-6 mt-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Gerenciar Alunos - {nomeTurma}
          </h1>
          <p className="text-gray-600 mt-1">
            Adicione ou remova alunos desta turma
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Seção de Adicionar Clientes */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg border">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-500 rounded-lg">
                  <UserPlus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Adicionar Alunos</h2>
                  <p className="text-gray-600 text-sm">Busque clientes para adicionar à turma</p>
                </div>
              </div>
              
              <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Pesquisar por nome ou CPF..."
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch} disabled={loading}>
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </Button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                        <span className="text-gray-500 mt-2 block">Carregando...</span>
                      </TableCell>
                    </TableRow>
                  ) : (
                    clientes.map((cliente) => (
                      <TableRow
                        key={cliente.id}
                        className={
                          alunos.find((aluno) => aluno.cliente_id == +cliente.id)
                            ? "bg-red-50 opacity-75"
                            : "hover:bg-gray-50"
                        }
                      >
                        <TableCell className="font-medium">{cliente.nome}</TableCell>
                        <TableCell>
                          {cliente.telefone1 ? formatarTelefone(cliente.telefone1) : ""}
                        </TableCell>
                        <TableCell>{cliente.status}</TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MenuIcon className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {!alunos.find((aluno) => aluno.cliente_id == +cliente.id) ? (
                                <DropdownMenuItem
                                  onSelect={() => addAluno(+cliente.id, turmaId)}
                                  className="text-green-600"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Adicionar
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem disabled>
                                  Já Matriculado
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Seção de Alunos Matriculados */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg border">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <GraduationCap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Alunos Matriculados</h2>
                    <p className="text-gray-600 text-sm">Total: {alunos.length} alunos</p>
                  </div>
                </div>
                {alunos.length > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => {
                            setisModalDeleteAllOpen(true);
                          }}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remover Todos
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Remover todos os alunos desta turma</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Pesquisar aluno matriculado..."
                    value={termoBuscaAluno}
                    onChange={(e) => setTermoBuscaAluno(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" onClick={handleSearchAluno}>
                  <Search className="w-4 h-4 mr-2" />
                  Filtrar
                </Button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Data Matrícula</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingAluno ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                        <span className="text-gray-500 mt-2 block">Carregando...</span>
                      </TableCell>
                    </TableRow>
                  ) : alunos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        Nenhum aluno matriculado nesta turma
                      </TableCell>
                    </TableRow>
                  ) : (
                    alunos.map((aluno) => (
                      <TableRow key={aluno.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          {aluno.cliente.nome}
                        </TableCell>
                        <TableCell>
                          {aluno.cliente.telefone1
                            ? formatarTelefone(aluno.cliente.telefone1)
                            : ""}
                        </TableCell>
                        <TableCell>
                          {aluno.data_inscricao
                            ? formatDate(aluno.data_inscricao, "dd/MM/yyyy")
                            : ""}
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MenuIcon className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={() => {
                                  setAlunoSelecionado(aluno);
                                  setIsDetalhesOpen(true);
                                }}
                              >
                                Ver Perfil
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={() => {
                                  setisModalDeleteOpen(true);
                                  setAlunoSelecionado(aluno);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remover
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmação para remover todos os alunos */}
      <Dialog open={isModalDeleteAllOpen} onOpenChange={setisModalDeleteAllOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Ação</DialogTitle>
          </DialogHeader>
          <p>Tem certeza que deseja remover todos os alunos desta turma?</p>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setisModalDeleteAllOpen(false)}
              disabled={loadingDeleteAll}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteAllAlunos();
                setisModalDeleteAllOpen(false);
              }}
              disabled={loadingDeleteAll}
            >
              {loadingDeleteAll ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação para remover aluno individual */}
      <Dialog open={isModalDeleteOpen} onOpenChange={setisModalDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Ação</DialogTitle>
          </DialogHeader>
          <p>
            Tem certeza que deseja remover {alunoSelecionado?.cliente.nome} da turma?
          </p>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setisModalDeleteOpen(false)}
              disabled={loadingAluno}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (alunoSelecionado) {
                  excluirAluno(alunoSelecionado.id);
                }
                setisModalDeleteOpen(false);
              }}
              disabled={loadingAluno}
            >
              {loadingAluno ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de detalhes do aluno */}
      <AlunoDetalhesModal
        isOpen={isDetalhesOpen}
        onOpenChange={setIsDetalhesOpen}
        aluno={alunoSelecionado}
      />
    </div>
  );
}