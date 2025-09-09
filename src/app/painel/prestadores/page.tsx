"use client";
import { useEffect, useState } from "react";
import ReactPaginate from "react-paginate";
import * as Tooltip from "@radix-ui/react-tooltip";
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
  MessageCircle,
} from "lucide-react";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Link from "next/link";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatarCPF, formatarTelefone } from "@/util/clearData";
import { Prestador } from "@/app/types/Prestador";
export default function Prestadores() {
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalPrestadores, setTotalPrestadores] = useState(0);
  const [termoBusca, setTermoBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [prestadorSelecionado, setPrestadorSelecionado] =
    useState<Prestador | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingInativar, setLoadingInativar] = useState(false);
  const carregarPrestadores = async () => {
    setCarregando(true);
    try {
      const params = new URLSearchParams({
        page: (paginaAtual + 1).toString(),
        limit: '10',
        search: termoBusca,
      });
      const response = await fetch(`/api/prestadores?${params}`);
      const data = await response.json();
      if (response.ok) {
        setPrestadores(data.data);
        setTotalPaginas(data.pagination.totalPages);
        setTotalPrestadores(data.pagination.total);
      } else {
        toast.error("Erro ao carregar prestadores");
      }
    } catch (error) {
      toast.error("Erro ao carregar prestadores");
    } finally {
      setCarregando(false);
    }
  };
  const alterarStatusPrestador = async () => {
    if (!prestadorSelecionado) return;
    setLoadingInativar(true);
    const novoStatus =
      prestadorSelecionado.status === "Ativo" ? "Inativo" : "Ativo";
    try {
      const response = await fetch(`/api/prestadores?id=${prestadorSelecionado.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: novoStatus,
        }),
      });
      if (response.ok) {
        setPrestadores((prestadores) =>
          prestadores.map((prestador) =>
            prestador.id === prestadorSelecionado.id
              ? { ...prestador, status: novoStatus }
              : prestador
          )
        );
        novoStatus === "Ativo"
          ? toast.success(`Status do prestador alterado para ${novoStatus}!`)
          : toast.error(`Status do prestador alterado para ${novoStatus}!`);
        setIsDialogOpen(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Erro ao alterar status");
      }
    } catch (error) {
      toast.error("Erro ao alterar status do prestador");
    } finally {
      setLoadingInativar(false);
    }
  };
  useEffect(() => {
    carregarPrestadores();
    const params = new URLSearchParams(window.location.search);
    const message = params.get("message");
    const type = params.get("type");
    if (message && type == "success") {
      toast.success("Prestador salvo com sucesso!");
    } else if (type == "error") {
      toast.error(message);
    }
    const newUrl = window.location.pathname;
    window.history.replaceState({}, "", newUrl);
  }, [paginaAtual]);
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (termoBusca !== '') {
        setPaginaAtual(0);
        carregarPrestadores();
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [termoBusca]);
  const handleSearch = () => {
    setPaginaAtual(0);
    carregarPrestadores();
  };
  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Lista de Prestadores" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-4 mt-5">Lista de Prestadores</h1>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Pesquisar prestador"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-96 max-w-lg"
          />
          <Button variant="secondary" onClick={handleSearch}>
            <Search className="w-4 h-4" />
            Buscar
          </Button>
        </div>
        <Button asChild>
          <Link href="/painel/prestadores/novo">
            <Plus className="h-5 w-5 mr-2" />
            Novo Prestador
          </Link>
        </Button>
      </div>
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
                <TableHead className="h-12-1">ID</TableHead>
                <TableHead className="h-12-1">Prestador</TableHead>
                <TableHead className="h-12-1">CPF</TableHead>
                <TableHead className="h-12-1">Celular</TableHead>
                <TableHead className="h-12-1">Status</TableHead>
                <TableHead className="h-12-1">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-center">
              {prestadores.map((prestador) => (
                <TableRow
                  key={prestador.id}
                  className={cn(
                    "odd:bg-gray-100 even:bg-white",
                    prestador.status === "Inativo" && "bg-gray-50 text-gray-500 opacity-75"
                  )}
                >
                  <TableCell>{prestador.id}</TableCell>
                  <TableCell>{prestador.nome}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={cn(
                        prestador.status === "Inativo" && "bg-gray-100 text-gray-400 border-gray-200"
                      )}
                    >
                      {formatarCPF(prestador.cpf)}
                    </Badge>
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
                              href={`https://wa.me/55${prestador.celular
                                ?.toString()
                                .replace(/\D/g, "")}`}
                            >
                              {prestador.celular
                                ? formatarTelefone(prestador.celular)
                                : prestador.celular}
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
                  <TableCell
                    className={`${
                      prestador.status === "Ativo"
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {prestador.status}
                  </TableCell>
                  <TableCell className="flex gap-3 justify-center">
                    <Tooltip.Provider>
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <Link
                            href={`/painel/prestadores/editar/${prestador.id}`}
                          >
                            <Button 
                              size="icon" 
                              variant="outline"
                              className={prestador.status === "Inativo" ? "opacity-60" : ""}
                            >
                              <Edit className="h-5 w-5" />
                            </Button>
                          </Link>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content
                            side="top"
                            className="bg-gray-700 text-white text-xs px-2 py-1 rounded-md shadow-md"
                          >
                            Editar Prestador
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                    <Tooltip.Provider>
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => {
                              setPrestadorSelecionado(prestador);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Power
                              className={`h-5 w-5 ${
                                prestador.status === "Ativo"
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
                            {prestador.status === "Ativo"
                              ? "Inativar Prestador"
                              : "Ativar Prestador"}
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-between items-center ml-1 mt-4">
            <div className="text-sm text-gray-600">
              Mostrando {Math.min((paginaAtual + 1) * 10, totalPrestadores)} de{" "}
              {totalPrestadores} prestadores
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
          <p>
            Tem certeza que deseja{" "}
            {prestadorSelecionado?.status === "Ativo" ? "inativar" : "ativar"}{" "}
            esta prestador?
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
              onClick={alterarStatusPrestador}
              disabled={loadingInativar}
            >
              {loadingInativar ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : prestadorSelecionado?.status === "Ativo" ? (
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