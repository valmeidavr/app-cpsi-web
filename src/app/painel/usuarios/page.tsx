"use client";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Edit, Plus, Trash, Mail, Users } from "lucide-react";
import ReactPaginate from "react-paginate";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import * as Tooltip from "@radix-ui/react-tooltip";
import {
  DialogFooter,
  DialogHeader,
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { http } from "@/util/http";
import { Usuario } from "@/app/types/Usuario";
export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [termoBusca, setTermoBusca] = useState("");
  const [loading, setLoading] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingInativar, setLoadingInativar] = useState(false);
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const searchParams = new URLSearchParams({
        page: (paginaAtual + 1).toString(),
        limit: '10',
        search: termoBusca,
      })
      const response = await fetch(`/api/usuarios?${searchParams.toString()}`)
      
      if (response.ok) {
        const data = await response.json()
        setUsuarios(data.data || [])
        setTotalPaginas(data.pagination?.totalPages || 1)
        setTotalUsuarios(data.pagination?.total || 0)
      } else {
        throw new Error('Erro ao carregar usuários')
      }
    } catch (error) {
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  };
  useEffect(() => {
    fetchUsers();
    const params = new URLSearchParams(window.location.search);
    const message = params.get("message");
    const type = params.get("type");
    if (message && type == "success") {
      toast.success(message);
    } else if (type == "error") {
      toast.error(message);
    }
    const newUrl = window.location.pathname;
    window.history.replaceState({}, "", newUrl);
  }, [paginaAtual]);
  const handleSearch = () => {
    setPaginaAtual(0);
    fetchUsers();
  };
  const deletarUsuario = async () => {
    if (!usuarioSelecionado) return;
    setLoadingInativar(true);
    try {
      const response = await fetch(`/api/usuarios?login=${usuarioSelecionado.login}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove da lista local após sucesso na API
        setUsuarios((prevUsuarios) =>
          prevUsuarios.filter((usuario) => usuario.login !== usuarioSelecionado.login)
        );
        toast.success("Usuário deletado com sucesso!");
        setIsDialogOpen(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Erro ao deletar usuário");
      }
    } catch (error) {
      toast.error("Erro ao deletar usuário");
    } finally {
      setLoadingInativar(false);
    }
  };
  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Lista de Usuários" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-4 mt-5">Lista de Usuários</h1>
      {}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Pesquisar usuário"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-96 max-w-lg"
          />
          <Button variant="secondary" onClick={handleSearch}>
            <Search className="w-4 h-4" />
            Buscar
          </Button>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/painel/usuarios/novo">
              <Plus className="h-5 w-5 mr-2" />
              Novo Usuário
            </Link>
          </Button>
        </div>
      </div>
      <div>
        {loading ? (
          <div className="flex justify-center items-center w-full h-40">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">Carregando ...</span>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Login</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Nível de Acesso</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((usuario) => (
                  <TableRow
                    key={usuario.login}
                    className={cn(
                      "odd:bg-gray-100 even:bg-white",
                      usuario.status === "Inativo" && "bg-gray-50 text-gray-500 opacity-75"
                    )}
                  >
                    <TableCell>{usuario.login}</TableCell>
                    <TableCell>{usuario.nome}</TableCell>
                    <TableCell className="white-space: nowrap;">
                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <div className="flex gap-1.5 items-center">
                            <Mail className="w-4 h-4" />
                            <Tooltip.Trigger asChild>
                              <a
                                target="_blank"
                                className="hover:text-blue-500"
                                href={`mailto:${usuario.email}`}
                              >
                                {usuario.email}
                              </a>
                            </Tooltip.Trigger>
                          </div>
                          <Tooltip.Portal>
                            <Tooltip.Content
                              side="top"
                              className="bg-gray-700 text-white text-xs px-2 py-1 rounded-md shadow-md"
                            >
                              Enviar Email
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </Tooltip.Provider>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {usuario.grupos && usuario.grupos.length > 0 ? (
                          usuario.grupos.map((grupo, index) => {
                            // Definir cores por sistema com base no nome do sistema
                            const getSystemColor = (sistema: string) => {
                              const sistemaLower = sistema.toLowerCase();
                              if (sistemaLower.includes('saude') || sistemaLower.includes('principal')) {
                                return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100";
                              } else if (sistemaLower.includes('cpsi') || sistemaLower.includes('financeiro')) {
                                return "bg-green-50 text-green-700 border-green-200 hover:bg-green-100";
                              } else if (sistemaLower.includes('agendamento')) {
                                return "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100";
                              } else if (sistemaLower.includes('relatorio')) {
                                return "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100";
                              } else {
                                return "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100";
                              }
                            };

                            const getSystemIcon = (sistema: string) => {
                              const iconClass = "w-3 h-3 mr-1.5";
                              const sistemaLower = sistema.toLowerCase();
                              if (sistemaLower.includes('saude') || sistemaLower.includes('principal')) {
                                return <Users className={iconClass} />;
                              } else if (sistemaLower.includes('cpsi') || sistemaLower.includes('financeiro')) {
                                return <div className={`${iconClass} rounded-full bg-current`} />;
                              } else if (sistemaLower.includes('agendamento')) {
                                return <div className={`${iconClass} rounded bg-current`} />;
                              } else if (sistemaLower.includes('relatorio')) {
                                return <div className={`${iconClass} rounded-sm bg-current`} />;
                              } else {
                                return <Users className={iconClass} />;
                              }
                            };

                            return (
                              <Tooltip.Provider key={index}>
                                <Tooltip.Root>
                                  <Tooltip.Trigger asChild>
                                    <Badge 
                                      className={cn(
                                        "px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-default flex items-center",
                                        usuario.status === "Inativo" 
                                          ? "bg-gray-50 text-gray-400 border-gray-200" 
                                          : getSystemColor(grupo.sistema)
                                      )}
                                    >
                                      {getSystemIcon(grupo.sistema)}
                                      <div className="flex flex-col items-start">
                                        <span className="font-semibold text-xs leading-tight">{grupo.nome}</span>
                                        <span className="text-[10px] opacity-75 leading-tight">{grupo.sistema}</span>
                                      </div>
                                    </Badge>
                                  </Tooltip.Trigger>
                                  <Tooltip.Portal>
                                    <Tooltip.Content
                                      side="top"
                                      className="bg-gray-800 text-white text-xs px-3 py-2 rounded-lg shadow-lg border border-gray-700"
                                    >
                                      <div className="font-medium">{grupo.sistema}</div>
                                      <div className="text-gray-300">Grupo: {grupo.nome}</div>
                                    </Tooltip.Content>
                                  </Tooltip.Portal>
                                </Tooltip.Root>
                              </Tooltip.Provider>
                            );
                          })
                        ) : (
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
                            <div className="w-2 h-2 rounded-full bg-gray-300" />
                            <span className="text-gray-500 text-xs font-medium">
                              Sem acesso
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="flex gap-2 justify-center items-center h-[83px] w-full">
                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <Link
                              className="h-10"
                              href={`/painel/usuarios/editar/${usuario.login}`}
                            >
                              <Button size="icon" variant="outline">
                                <Edit className="h-5 w-5" />
                              </Button>
                            </Link>
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content
                              side="top"
                              className="bg-gray-700 text-white text-xs px-2 py-1 rounded-md shadow-md"
                            >
                              Editar Usuário
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </Tooltip.Provider>
                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={() => {
                                setUsuarioSelecionado(usuario);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Trash className="h-5 w-5" />
                            </Button>
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content
                              side="top"
                              className="bg-gray-700 text-white text-xs px-2 py-1 rounded-md shadow-md"
                            >
                              Deletar Usuário
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </Tooltip.Provider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {}
            <div className="flex justify-between items-center ml-1 mt-4">
              <div className="text-sm text-gray-600">
                Mostrando {Math.min((paginaAtual + 1) * 5, totalUsuarios)} de{" "}
                {totalUsuarios} usuários
              </div>
            </div>
            <div className="flex justify-center mt-4">
              <ReactPaginate
                previousLabel={
                  <span className="w-full h-full flex items-center justify-center">
                    ←
                  </span>
                }
                nextLabel={
                  <span className="w-full h-full flex items-center justify-center">
                    →
                  </span>
                }
                pageCount={totalPaginas}
                forcePage={paginaAtual}
                onPageChange={(event) => setPaginaAtual(event.selected)}
                containerClassName={"flex gap-2"}
                pageClassName={
                  "border rounded-md flex items-center justify-center cursor-pointer w-10 h-10"
                }
                activeClassName={"bg-blue-500 text-white"}
                previousClassName={
                  "border rounded-md flex items-center justify-center cursor-pointer w-10 h-10"
                }
                nextClassName={
                  "border rounded-md flex items-center justify-center cursor-pointer w-10 h-10"
                }
                disabledClassName={"opacity-50 cursor-not-allowed"}
                pageLinkClassName={
                  "w-full h-full flex items-center justify-center"
                }
                previousLinkClassName={
                  "w-full h-full flex items-center justify-center"
                }
                nextLinkClassName={
                  "w-full h-full flex items-center justify-center"
                }
              />
            </div>
          </>
        )}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Ação</DialogTitle>
            </DialogHeader>
            <p>Tem certeza que deseja deletar este usuário? Esta ação não pode ser desfeita e o usuário será removido permanentemente do sistema.</p>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setIsDialogOpen(false)}
                disabled={loadingInativar}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => deletarUsuario()}
                disabled={loadingInativar}
              >
                {loadingInativar ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Deletar"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {}
      </div>
    </div>
  );
}