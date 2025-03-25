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
import {
  Loader2,
  Search,
  Edit,
  Power,
  Plus,
  Eye,
  Trash,
  Mail,
} from "lucide-react";
import ReactPaginate from "react-paginate";
import { http } from "@/util/http";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import * as Tooltip from "@radix-ui/react-tooltip";
import { deleteUsuario } from "@/app/api/usuarios/action";
import {
  DialogFooter,
  DialogHeader,
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
// ✅ Definir o tipo Usuario
interface Usuario {
  id: number;
  nome: string;
  email: string;
  grupos: {
    grupo: {
      id: number;
      nome: string;
      sistema: {
        nome: string;
      };
    };
  }[];
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [termoBusca, setTermoBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const carregarUsuarios = async () => {
    setCarregando(true);
    try {
      const { data } = await http.get("/users", {
        params: {
          page: paginaAtual + 1,
          limit: 5,
          search: termoBusca,
        },
      });

      setUsuarios(data.data);
      setTotalPaginas(data.totalPages);
      setTotalUsuarios(data.total);
    } catch (error) {
      console.error("Erro ao buscar usuarios:", error);
    } finally {
      setCarregando(false);
    }
  };

  const formatarPalavra = (palavra: string): string => {
    return palavra.replace("U", "Ú");
  };

  useEffect(() => {
    carregarUsuarios();
  }, [paginaAtual]);

  const handleSearch = () => {
    setPaginaAtual(0);
    carregarUsuarios();
  };

  const deletarUsuario = async () => {
    if (!usuarioSelecionado) return;
    setCarregando(true);
    try {
      await deleteUsuario(usuarioSelecionado.id);
      setUsuarios((prevUsuarios) =>
        prevUsuarios.filter((usuario) => usuario.id !== usuarioSelecionado.id)
      );
      toast.warning("Usuário deletado com sucesso!");
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Erro ao alterar status do cliente:", error);
    } finally {
      setCarregando(false);
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

        {/* ✅ Botão Novo Usuario */}
        <Button asChild>
          <Link href="/painel/usuarios/novo">
            <Plus className="h-5 w-5 mr-2" />
            Novo Usuário
          </Link>
        </Button>
      </div>

      <div>
        {carregando ? (
          <div className="flex justify-center items-center w-full h-40">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">Carregando ...</span>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Nível de Acesso</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((usuario) => (
                  <TableRow
                    key={usuario.id}
                    className="odd:bg-gray-100 even:bg-white"
                  >
                    <TableCell>{usuario.id}</TableCell>
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
                    <TableCell className="white-space: nowrap;">
                      {usuario.grupos.map((g) => (
                        <div
                          className="flex gap-2 align-middle items-center justify-between space-y-2"
                          key={g.grupo.id}
                        >
                          <h2>{formatarPalavra(g.grupo.sistema.nome)}:</h2>
                          <Badge>{g.grupo.nome}</Badge>
                        </div>
                      ))}
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <Link
                              href={`/painel/usuarios/editar/${usuario.id}`}
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
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={() => deletarUsuario()}>
                Deletar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de detalhes */}
      </div>
    </div>
  );
}
