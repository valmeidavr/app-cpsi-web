"use client";
//React
import { useEffect, useState } from "react";
//Components
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

//API
import { http } from "@/util/http";
//Types
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
        limit: '5',
        search: termoBusca,
      })

      const response = await fetch(`/api/usuarios?${searchParams.toString()}`)
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Data received:', data)
        setUsuarios(data.data || data) // Ajuste para a nova estrutura da API
        setTotalUsuarios(data.pagination?.total || 0)
        setTotalPaginas(data.pagination?.totalPages || 1)
      } else {
        console.error('Erro na resposta:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
    } finally {
      setLoading(false)
    }
  }


  const formatarPalavra = (palavra: string): string => {
    return palavra.replace("U", "Ú");
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
      // Por enquanto, apenas remove da lista local
      // TODO: Implementar API de delete quando necessário
      setUsuarios((prevUsuarios) =>
        prevUsuarios.filter((usuario) => usuario.login !== usuarioSelecionado.login)
      );
      toast.success("Usuário removido da lista!");
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
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

      {/* Barra de Pesquisa e Botão Novo Usuario */}
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
          {/* ✅ Botão Gerenciar Acesso */}
          <Button variant="outline" asChild>
            <Link href="/painel/usuarios/gerenciar-acesso">
              <Users className="h-5 w-5 mr-2" />
              Gerenciar Acesso
            </Link>
          </Button>
          
          {/* ✅ Botão Novo Usuario */}
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
                    className="odd:bg-gray-100 even:bg-white"
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
                      <div className="flex flex-wrap gap-1">
                        {usuario.sistemas && usuario.sistemas.length > 0 ? (
                          usuario.sistemas.map((sistema, index) => (
                            <Badge key={index} variant="secondary">
                              {sistema.nome}: {sistema.nivel}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">Sem acesso</span>
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

            {/* Totalizador de Usuarios */}
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
            <p>Tem certeza que deseja deletar este usuario?</p>
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

        {/* Modal de detalhes */}
      </div>
    </div>
  );
}
