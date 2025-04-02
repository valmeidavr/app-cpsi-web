"use client";

//React
import { useEffect, useState } from "react";
import ReactPaginate from "react-paginate";
import * as Tooltip from "@radix-ui/react-tooltip";

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
import { Loader2, Search, Edit, Power, Plus } from "lucide-react";
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

//Helpers
import { http } from "@/util/http";
import { toast } from "sonner";


interface PrestadorProps{
  id: number | string,
  nome: string,
  cpf: string,
  status: string,
  celular: string
}

export default function Prestadores() {
  const [prestadores, setPrestadores] = useState<PrestadorProps[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalPrestadores, setTotalPrestadores] = useState(0);
  const [termoBusca, setTermoBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [prestadorSelecionado, setPrestadorSelecionado] =
    useState<PrestadorProps | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingInativar, setLoadingInativar] = useState(false);

  const carregarPrestadores = async () => {
    setCarregando(true);
    try {
      const { data } = await http.get("/prestadores", {
        params: {
          page: paginaAtual + 1,
          limit: 5,
          search: termoBusca,
        },
      });

      setPrestadores(data.data);
      setTotalPaginas(data.totalPages);
      setTotalPrestadores(data.total);
    } catch (error) {
      console.error("Erro ao buscar prestadores:", error);
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
      await http.patch(
        `/prestadores/${prestadorSelecionado.id}`,
        {
          status: novoStatus,
        }
      );
      setPrestadores((prestadores) =>
        prestadores.map((prestador) =>
          prestador.id === prestadorSelecionado.id
            ? { ...prestador, status: novoStatus }
            : prestador
        )
      );
     novoStatus === "Ativo"
       ? toast.success(`Status do cliente alterado para ${novoStatus}!`)
       : toast.error(`Status do cliente alterado para ${novoStatus}!`);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Erro ao alterar status do prestador:", error);
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
      toast.success(message);
    } else if (type == "error") {
      toast.error(message);
    }
    const newUrl = window.location.pathname;
    window.history.replaceState({}, "", newUrl);
  }, [paginaAtual]);

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

      {/* Barra de Pesquisa e Botão Novo Prestador */}
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

        {/* ✅ Botão Novo Prestador */}
        <Button asChild>
          <Link href="/painel/prestadores/novo">
            <Plus className="h-5 w-5 mr-2" />
            Novo Prestador
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
          {/* Tabela de Prestadores */}
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
                  className={"odd:bg-gray-100 even:bg-white"}
                >
                  <TableCell>{prestador.id}</TableCell>
                  <TableCell>{prestador.nome}</TableCell>
                  <TableCell>{prestador.cpf}</TableCell>
                  <TableCell>
                    <Badge>{prestador.celular}</Badge>
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
                    {/* ✅ Botão Editar com Tooltip */}
                    {prestador.status === "Ativo" && (
                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <Link
                              href={`/painel/prestadores/editar/${prestador.id}`}
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
                              Editar Prestador
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
          {/* Totalizador de Prestadores */}
          <div className="flex justify-between items-center ml-1 mt-4">
            <div className="text-sm text-gray-600">
              Mostrando {Math.min((paginaAtual + 1) * 5, totalPrestadores)} de{" "}
              {totalPrestadores} prestadores
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
            {prestadorSelecionado?.status === "Ativo"
              ? "inativar"
              : "ativar"}{" "}
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
