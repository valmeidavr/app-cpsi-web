import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, MenuIcon, Search, Trash2 } from "lucide-react";
import { Cliente } from "@/app/types/Cliente";
import { http } from "@/util/http";
import { getClientes } from "@/app/api/clientes/action";
import { Input } from "@/components/ui/input";
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
import {
  createAlunosTurma,
  deleteAllAlunoTurma,
  deleteAlunoTurma,
} from "@/app/api/alunos_turmas/action";
import { Label } from "@/components/ui/label";
import { formatarTelefone } from "@/util/clearData";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getTurmaById } from "@/app/api/turmas/action";
import { Turma } from "@/app/types/Turma";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  turmaId: number;
}

export default function AdicionarAlunosModal({
  isOpen,
  onOpenChange,
  turmaId,
}: Props) {
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

  const [turmaSelected, setTurmaSelected] = useState<number>(0);
  const [loadingDeleteAll, setLoadingDeleteAll] = useState(false);
  const carregarClientes = async () => {
    try {
      setLoading(true);
      const { data } = await http.get("/clientes", {
        params: {
          page: paginaAtual + 1,
          limit: 5,
          search: termoBusca,
        },
      });

      setClientes(data.data);

    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteAllAlunos = async () => {
    try {
      setLoadingDeleteAll(true);
      await deleteAllAlunoTurma(turmaSelected);
      await carregarAlunos();
    } catch (error) {
      console.error("Erro ao deletar todos os alunos:", error);
    } finally {
      setLoadingDeleteAll(false);
    }
  };
  const addAluno = async (clientesId: number, turmasId: number) => {
    try {
      setLoadingAluno(true);
      const turma: Turma = await getTurmaById(turmaId);
      if (alunos.length == turma.limiteVagas) {
        throw new Error("Turma está lotada");
      }
      const payload = {
        clientesId,
        turmasId,
        data_inscricao: new Date().toISOString().split("T")[0],
      };
      await createAlunosTurma(payload);
      await carregarAlunos();
    } catch (error: any) {
      toast.error(`Erro ao adicionar alunos: ${error.message}`);
    } finally {
      setLoadingAluno(false);
    }
  };
  const excluirAluno = async (alunoId: number) => {
    try {
      setLoadingAluno(true);
      await deleteAlunoTurma(alunoId);
      await carregarAlunos();
    } catch (error) {
      console.error("Erro ao deletar alunos:", error);
    } finally {
      setLoadingAluno(false);
    }
  };

  const carregarAlunos = async () => {
    try {
      setLoadingAluno(true);
      const { data } = await http.get("http://localhost:3000/alunos-turmas/", {
        params: {
          page: paginaAtual + 1,
          limit: 5,
          search: termoBuscaAluno,
          turmaId: turmaId,
        },
      });
      setAlunos(data.data);
    } catch (error) {
      console.error("Erro ao carregar alunos:", error);
    } finally {
      setLoadingAluno(false);
    }
  };

  useEffect(() => {
    carregarAlunos();
  }, [paginaAtual]);

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
        <DialogContent className="w-full max-w-6xl max-h-[90vh] ">
          <DialogHeader>
            <DialogTitle>Confirmar Ação</DialogTitle>
          </DialogHeader>
          <div className="flex justify-between items-center mb-1">
            <div>
              <Label>Buscar Clientes: </Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Pesquisar Cliente"
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="w-96 max-w-lg"
                />
                <Button variant="default" onClick={handleSearch}>
                  <Search className="w-4 h-4" />
                  Buscar
                </Button>
              </div>
            </div>
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            <Table className="mb-2 w-full border-b">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Nome</TableHead>
                  <TableHead className="w-[100px] text-center">
                    Celular
                  </TableHead>
                  <TableHead className="w-[100px] text-center">
                    Data de Nascimento
                  </TableHead>
                  <TableHead className="w-[100px] text-center">
                    Situação
                  </TableHead>
                  <TableHead className="w-[100px] text-center">
                    Opções
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
                      className={`cursor-context-menu text-center 
                        ${
                          alunos.find(
                            (aluno) => aluno.clientesId == +cliente.id
                          )
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-60"
                            : "hover:bg-blue-100 cursor-pointer"
                        }
                        `}
                    >
                      <TableCell className="text-start">
                        {cliente.nome}
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
                              onSelect={() =>
                                alert(`Ver perfil de ${cliente.nome}`)
                              }
                            >
                              Ver Perfil
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {!alunos.find(
                              (aluno) => aluno.clientesId == +cliente.id
                            ) ? (
                              <DropdownMenuItem
                                onSelect={() => addAluno(+cliente.id, turmaId)}
                              >
                                Adicionar Aluno
                              </DropdownMenuItem>
                            ) : (
                              ""
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

          <div className="flex justify-between items-end mt-2 ">
            <div>
              <Label>Buscar Alunos: </Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Pesquisar Aluno"
                  value={termoBuscaAluno}
                  onChange={(e) => setTermoBuscaAluno(e.target.value)}
                  className="w-96 max-w-lg"
                />
                <Button variant="default" onClick={handleSearchAluno}>
                  <Search className="w-4 h-4" />
                  Buscar
                </Button>
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
                    variant={"destructive"}
                  >
                    <Trash2 />{" "}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Excluir Todos os Alunos</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            <Table className="mb-2 w-full border-b">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Nome</TableHead>
                  <TableHead className="w-[100px] text-center">
                    Celular
                  </TableHead>
                  <TableHead className="w-[100px] text-center">
                    Data de Nascimento
                  </TableHead>
                  <TableHead className="w-[100px] text-center">
                    Data de Inclusão
                  </TableHead>
                  <TableHead className="w-[100px] text-center">
                    Situação
                  </TableHead>
                  <TableHead className="w-[100px] text-center">
                    Opções
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
                      className="cursor-context-menu text-center"
                    >
                      <TableCell className="text-start">
                        {aluno.cliente.nome}
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
                              onSelect={() =>
                                alert(`Ver perfil de ${aluno.cliente.nome}`)
                              }
                            >
                              Ver Perfil
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => {
                                setisModalDeleteOpen(true),
                                  setAlunoSelecionado(aluno);
                              }}
                            >
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
          <DialogFooter>
            <Button type="submit" variant="default" disabled={loadingAluno}>
              {loadingAluno ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>Fechar</span>
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

      <Dialog
        open={isModalDeleteOpen}
        onOpenChange={setisModalDeleteOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Ação</DialogTitle>
          </DialogHeader>
          <p>Tem certeza que deseja excluir o {alunoSelecionado?.cliente.nome} da turma?</p>
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
    </div>
  );
}
