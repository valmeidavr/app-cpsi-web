"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { getDateOnlyUTCISO } from "@/app/helpers/dateUtils";
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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { formatarTelefone } from "@/util/clearData";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Turma } from "@/app/types/Turma";
import { Loader2, MenuIcon, Search, Trash2, Plus, Users, UserPlus, GraduationCap } from "lucide-react";
import AlunoDetalhesModal from "./detalhesAlunoModal";
import { http } from "@/util/http";
interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  turmaId: number;
}
const AdicionarAlunosModal: React.FC<Props> = ({ isOpen, onOpenChange, turmaId }) => {
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
  const [turmaSelected, setTurmaSelected] = useState<number>(0);
  const [loadingDeleteAll, setLoadingDeleteAll] = useState(false);
  const carregarClientes = async () => {
    try {
      setLoading(true);
      const { data } = await http.get("/api/clientes", {
        params: {
          page: paginaAtual + 1,
          limit: 5,
          search: termoBusca,
        },
      });
      setClientes(data.data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  const deleteAllAlunos = async () => {
    try {
      setLoadingDeleteAll(true);
      await http.delete(`/api/alunos_turmas/${turmaSelected}`);
      await carregarAlunos();
    } catch (error) {
    } finally {
      setLoadingDeleteAll(false);
    }
  };
  const addAluno = async (cliente_id: number, turma_id: number) => {
    try {
      setLoadingAluno(true);
      const { data: turma } = await http.get(`/api/turmas/${turmaId}`);
      if (alunos.length == turma.limite_vagas) {
        throw new Error("Turma está lotada");
      }
      const payload = {
        cliente_id,
        turma_id,
        data_inscricao: getDateOnlyUTCISO(),
      };
      await http.post("/api/alunos_turmas", payload);
      await carregarAlunos();
    } catch (error) {
      toast.error(`Erro ao adicionar alunos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoadingAluno(false);
    }
  };
  const excluirAluno = async (alunoId: number) => {
    try {
      setLoadingAluno(true);
      await http.delete(`/api/alunos_turmas/${alunoId}`);
      await carregarAlunos();
    } catch (error) {
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
            limit: 5,
            search: termoBuscaAluno,
            turmaId: turmaId,
          },
        }
      );
      setAlunos(data.data);
    } catch (error) {
    } finally {
      setLoadingAluno(false);
    }
  };
  useEffect(() => {
    carregarAlunos();
  }, [paginaAtual]);
  useEffect(() => {
    if (isOpen) {
      carregarClientes();
    }
  }, [isOpen]);
  const handleSearch = () => {
    setPaginaAtual(0);
    carregarClientes();
  };
  const handleSearchAluno = () => {
    setPaginaAtual(0);
    carregarAlunos();
  };
  return (
    <div>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="w-full max-w-7xl max-h-[95vh] bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30">
          <DialogHeader className="pb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
                  Gerenciar Alunos da Turma
                </DialogTitle>
                <p className="text-slate-600 font-medium text-lg mt-1">
                  Adicione ou remova alunos desta turma
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Seção de Buscar Clientes */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">Adicionar Novos Alunos</h3>
                <p className="text-slate-600 text-sm">Busque e adicione clientes à turma</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Pesquisar por nome ou CPF..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="pl-10 h-12 text-base border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                />
              </div>
              <Button 
                variant="default" 
                onClick={handleSearch}
                className="h-12 px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl font-semibold"
              >
                <Search className="w-5 h-5 mr-2" />
                Buscar
              </Button>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-4 border-b">
              <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Clientes Disponíveis
              </h4>
            </div>
            <div className="max-h-[280px] overflow-y-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="font-semibold text-slate-700">Nome do Cliente</TableHead>
                  <TableHead className="text-center font-semibold text-slate-700">
                    Telefone
                  </TableHead>
                  <TableHead className="text-center font-semibold text-slate-700">
                    Nascimento
                  </TableHead>
                  <TableHead className="text-center font-semibold text-slate-700">
                    Status
                  </TableHead>
                  <TableHead className="text-center font-semibold text-slate-700">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="flex justify-center items-center h-20">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                        <span className="ml-2 text-gray-500">
                          Carregando ...
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  clientes.map((cliente) => (
                    <TableRow
                      key={cliente.id}
                      className={`text-center transition-colors 
                        ${
                          alunos.find(
                            (aluno) => aluno.cliente_id == +cliente.id
                          )
                            ? "bg-red-50 text-red-600 cursor-not-allowed opacity-75"
                            : "hover:bg-blue-50 cursor-pointer hover:shadow-sm"
                        }
                        `}
                    >
                      <TableCell className="text-start font-medium">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            alunos.find(
                              (aluno) => aluno.cliente_id == +cliente.id
                            ) ? "bg-red-500" : "bg-blue-500"
                          }`}></div>
                          {cliente.nome}
                        </div>
                      </TableCell>
                      <TableCell>
                        {cliente.telefone1
                          ? formatarTelefone(cliente.telefone1)
                          : ""}
                      </TableCell>
                      <TableCell>
                        {cliente.dtnascimento
                          ? formatDate(cliente.dtnascimento, "dd/MM/yyyy")
                          : ""}
                      </TableCell>
                      <TableCell>{cliente.status}</TableCell>
                      <TableCell className="flex items-center justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <MenuIcon />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => {
                                const alunoCorrespondente = alunos.find(
                                  (aluno) => aluno.cliente_id == +cliente.id
                                );
                                if (alunoCorrespondente) {
                                  setAlunoSelecionado(alunoCorrespondente);
                                  setIsDetalhesOpen(true);
                                } else {
                                  toast.info(
                                    "Este cliente não está matriculado nesta turma."
                                  );
                                }
                              }}
                            >
                              Ver Perfil
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {!alunos.find(
                              (aluno) => aluno.cliente_id == +cliente.id
                            ) ? (
                              <DropdownMenuItem
                                onSelect={() => addAluno(+cliente.id, turmaId)}
                                className="text-green-600 font-semibold"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar Aluno
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem disabled className="text-gray-500">
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
          
          {/* Seção de Alunos Matriculados */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Alunos Matriculados</h3>
                  <p className="text-slate-600 text-sm">Gerencie os alunos já matriculados na turma</p>
                </div>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => {
                        setisModalDeleteAllOpen(true);
                        setTurmaSelected(turmaId);
                      }}
                      variant="destructive"
                      className="h-11 px-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl"
                    >
                      <Trash2 className="h-5 w-5 mr-2" />
                      Remover Todos
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Excluir Todos os Alunos desta Turma</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Pesquisar aluno matriculado..."
                  value={termoBuscaAluno}
                  onChange={(e) => setTermoBuscaAluno(e.target.value)}
                  className="pl-10 h-12 text-base border-2 border-gray-200 focus:border-purple-500 rounded-xl"
                />
              </div>
              <Button 
                variant="outline" 
                onClick={handleSearchAluno}
                className="h-12 px-6 border-2 border-purple-200 hover:border-purple-500 rounded-xl font-semibold"
              >
                <Search className="w-5 h-5 mr-2" />
                Filtrar
              </Button>
            </div>
            <div className="bg-gradient-to-r from-slate-50 to-purple-50 rounded-xl p-3 border">
              <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-purple-600" />
                Lista de Alunos Matriculados ({alunos.length})
              </h4>
              <div className="max-h-[280px] overflow-y-auto bg-white rounded-lg border">
              <Table className="w-full">
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="font-semibold text-slate-700">Nome do Aluno</TableHead>
                  <TableHead className="text-center font-semibold text-slate-700">
                    Telefone
                  </TableHead>
                  <TableHead className="text-center font-semibold text-slate-700">
                    Nascimento
                  </TableHead>
                  <TableHead className="text-center font-semibold text-slate-700">
                    Data Matrícula
                  </TableHead>
                  <TableHead className="text-center font-semibold text-slate-700">
                    Status
                  </TableHead>
                  <TableHead className="text-center font-semibold text-slate-700">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingAluno ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="flex justify-center items-center h-20">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                        <span className="ml-2 text-gray-500">
                          Carregando ...
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  alunos.map((aluno) => (
                    <TableRow
                      key={aluno.id}
                      className="text-center hover:bg-purple-50 transition-colors"
                    >
                      <TableCell className="text-start font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          {aluno.cliente.nome}
                        </div>
                      </TableCell>
                      <TableCell>
                        {aluno.cliente.telefone1
                          ? formatarTelefone(aluno.cliente.telefone1)
                          : ""}
                      </TableCell>
                      <TableCell>
                        {aluno.cliente.dtnascimento
                          ? formatDate(aluno.cliente.dtnascimento, "dd/MM/yyyy")
                          : ""}
                      </TableCell>
                      <TableCell>
                        {aluno.data_inscricao
                          ? formatDate(aluno.data_inscricao, "dd/MM/yyyy")
                          : ""}
                      </TableCell>
                      <TableCell>{aluno.cliente.status}</TableCell>
                      <TableCell className="flex items-center justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <MenuIcon />
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
                                setisModalDeleteOpen(true),
                                  setAlunoSelecionado(aluno);
                              }}
                              className="text-red-600 font-semibold"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir Aluno
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

          <DialogFooter className="pt-6">
            <Button 
              type="button" 
              onClick={() => onOpenChange(false)}
              disabled={loadingAluno}
              className="px-8 py-3 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white rounded-xl font-semibold"
            >
              {loadingAluno ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Processando...
                </>
              ) : (
                <span>Concluir</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isModalDeleteAllOpen}
        onOpenChange={setisModalDeleteAllOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Ação</DialogTitle>
          </DialogHeader>
          <p>Tem certeza que deseja apagar todos os alunos desta turma?</p>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setisModalDeleteAllOpen(false)}
              disabled={loadingDeleteAll}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              onClick={() => {
                deleteAllAlunos();
                setisModalDeleteAllOpen(false);
              }}
              disabled={loadingDeleteAll}
            >
              Confirma
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isModalDeleteOpen} onOpenChange={setisModalDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Ação</DialogTitle>
          </DialogHeader>
          <p>
            Tem certeza que deseja excluir o {alunoSelecionado?.cliente.nome} da
            turma?
          </p>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setisModalDeleteOpen(false)}
              disabled={loadingDeleteAll}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                excluirAluno(alunoSelecionado!.id);
                setisModalDeleteOpen(false);
              }}
              disabled={loadingDeleteAll}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlunoDetalhesModal
        isOpen={isDetalhesOpen}
        onOpenChange={setIsDetalhesOpen}
        aluno={alunoSelecionado}
      />
    </div>
  );
}
export default AdicionarAlunosModal;