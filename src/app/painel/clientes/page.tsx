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
  Mail,
  MessageCircle,
} from "lucide-react";
import ReactPaginate from "react-paginate";
import { http } from "@/util/http";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import * as Tooltip from "@radix-ui/react-tooltip";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatarCPF, formatarTelefone } from "@/util/clearData";
import { toast } from "sonner";
import { Cliente } from "@/app/types/Cliente";


export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalClientes, setTotalClientes] = useState(0);
  const [termoBusca, setTermoBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingInativar, setLoadingInativar] = useState(false);

  const carregarClientes = async () => {
    setCarregando(true);
    try {
      const { data } = await http.get("/clientes", {
        params: {
          page: paginaAtual + 1,
          limit: 5,
          search: termoBusca,
        },
      });

      setClientes(data.data);
      setTotalPaginas(data.totalPages);
      setTotalClientes(data.total);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    } finally {
      setCarregando(false);
    }
  };

  // ✅ Atualiza status do cliente (Ativo/Inativo)
  const alterarStatusCliente = async () => {
    if (!clienteSelecionado) return;
    setLoadingInativar(true);
    const novoStatus =
      clienteSelecionado.status === "Ativo" ? "Inativo" : "Ativo";

    try {
      await http.patch(`/clientes/${clienteSelecionado.id}`, {
        status: novoStatus,
      });
      setClientes((clientes) =>
        clientes.map((cliente) =>
          cliente.id === clienteSelecionado.id
            ? { ...cliente, status: novoStatus }
            : cliente
        )
      );
      novoStatus === "Ativo"
        ? toast.success(`Status do cliente alterado para ${novoStatus}!`)
        : toast.error(`Status do cliente alterado para ${novoStatus}!`);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Erro ao alterar status do cliente:", error);
    } finally {
      setLoadingInativar(false);
    }
  };

  useEffect(() => {
    carregarClientes();
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
    carregarClientes();
  };

  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Lista de Clientes" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-4 mt-5">Lista de Clientes</h1>

      {/* Barra de Pesquisa e Botão Novo Cliente */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Pesquisar cliente"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-96 max-w-lg"
          />
          <Button variant="secondary" onClick={handleSearch}>
            <Search className="w-4 h-4" />
            Buscar
          </Button>
        </div>

        {/* ✅ Botão Novo Cliente */}
        <Button asChild>
          <Link href="/painel/clientes/novo">
            <Plus className="h-5 w-5 mr-2" />
            Novo Cliente
          </Link>
        </Button>
      </div>

      {/* Loader - Oculta a Tabela enquanto carrega */}
      {carregando ? (
        <div className="flex justify-center items-center w-full h-40">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Carregando ...</span>
        </div>
      ) : (
        <>
          {/* Tabela de Clientes */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-12-1">ID</TableHead>
                <TableHead className="h-12-1">Nome</TableHead>
                <TableHead className="h-12-1">CPF</TableHead>
                <TableHead className="h-12-1">Email</TableHead>
                <TableHead className="h-12-1">Telefone</TableHead>
                <TableHead className="h-12-1">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes.map((cliente) => (
                <TableRow
                  key={cliente.id}
                  className={"odd:bg-gray-100 even:bg-white"}
                >
                  <TableCell>{cliente.id}</TableCell>
                  <TableCell>{cliente.nome}</TableCell>
                  <TableCell className="text-[13px]">
                    <Badge variant="outline">{formatarCPF(cliente.cpf)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Tooltip.Provider>
                      <Tooltip.Root>
                        <div className="flex gap-1.5 items-center">
                          <Mail className="w-4 h-4" />
                          <Tooltip.Trigger asChild>
                            <a
                              target="_blank"
                              className="hover:text-blue-500"
                              href={`mailto:${cliente.email}`}
                            >
                              {cliente.email}\
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
                    <Tooltip.Provider>
                      <Tooltip.Root>
                        <div className="flex gap-0.5 items-center">
                          <MessageCircle className="w-4 h-4" />
                          <Tooltip.Trigger asChild>
                            <a
                              target="_blank"
                              className="hover:text-blue-500 text-[13px]"
                              href={`https://wa.me/55${cliente.telefone1.replace(
                                /\D/g,
                                ""
                              )}`}
                            >
                              {cliente.telefone1 ?? formatarTelefone(cliente.telefone1)}
                            </a>
                          </Tooltip.Trigger>
                        </div>
                        <Tooltip.Portal>
                          <Tooltip.Content
                            side="top"
                            className="bg-gray-700 text-white text-xs px-2 py-1 rounded-md shadow-md"
                          >
                            Abrir WhatsApp
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                  </TableCell>
                  <TableCell className="flex gap-3 justify-center">
                    {/* ✅ Botão Editar com Tooltip */}
                    {cliente.status === "Ativo" && (
                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <Link
                              href={`/painel/clientes/editar/${cliente.id}`}
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
                              Editar Cliente
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </Tooltip.Provider>
                    )}
                    {/* ✅ Botão Ativar/Inativar com Tooltip */}
                    <Tooltip.Provider>
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => {
                              setClienteSelecionado(cliente);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Power
                              className={`h-5 w-5 ${
                                cliente.status === "Ativo"
                                  ? "text-red-500"
                                  : "text-green-500"
                              }`}
                            />
                          </Button>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content
                            side="top"
                            className="bg-gray-700 text-white text-xs px-2 py-1 rounded-md shadow-md"
                          >
                            {cliente.status === "Ativo"
                              ? "Inativar Cliente"
                              : "Ativar Cliente"}
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Totalizador de Clientes */}
          <div className="flex justify-between items-center ml-1 mt-4">
            <div className="text-sm text-gray-600">
              Mostrando {Math.min((paginaAtual + 1) * 5, totalClientes)} de{" "}
              {totalClientes} clientes
            </div>
          </div>

          {/* ✅ Paginação */}
          {/* ✅ Paginação corrigida */}
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

      {/* ✅ Diálogo de Confirmação */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Ação</DialogTitle>
          </DialogHeader>
          <p>
            Tem certeza que deseja{" "}
            {clienteSelecionado?.status === "Ativo" ? "inativar" : "ativar"}{" "}
            este cliente?
          </p>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setIsDialogOpen(false)}
              disabled={loadingInativar}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              onClick={alterarStatusCliente}
              disabled={loadingInativar}
            >
              {loadingInativar ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : clienteSelecionado?.status === "Ativo" ? (
                "Inativar"
              ) : (
                "Ativar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
