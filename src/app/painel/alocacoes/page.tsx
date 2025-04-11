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
import { toast } from "sonner";
import { Alocacao } from "@/app/types/Alocacao";

export default function AlocacaosPage() {
  const [alocacaos, setAlocacaos] = useState<Alocacao[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalAlocacaos, setTotalAlocacaos] = useState(0);
  const [termoBusca, setTermoBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [alocacaoSelecionado, setAlocacaoSelecionado] =
    useState<Alocacao | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingInativar, setLoadingInativar] = useState(false);

  const carregarAlocacaos = async () => {
    setCarregando(true);
    try {
      const { data } = await http.get("http://localhost:3000/alocacoes", {
        params: {
          page: paginaAtual + 1,
          limit: 5,
          search: termoBusca,
        },
      });

      setAlocacaos(data.data);
      setTotalPaginas(data.totalPages);
      setTotalAlocacaos(data.total);
    } catch (error) {
      console.error("Erro ao buscar alocacaos:", error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarAlocacaos();
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
    carregarAlocacaos();
  };

  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Lista de Alocacaos" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-4 mt-5">Lista de Alocações</h1>

      {/* Barra de Pesquisa e Botão Novo Alocacao */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Pesquisar alocacao"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-96 max-w-lg"
          />
          <Button variant="secondary" onClick={handleSearch}>
            <Search className="w-4 h-4" />
            Buscar
          </Button>
        </div>

        {/* ✅ Botão Novo Alocacao */}
        <Button asChild>
          <Link href="/painel/alocacoes/novo">
            <Plus className="h-5 w-5 mr-2" />
            Nova Alocação
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
          {/* Tabela de Alocacaos */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Prestador</TableHead>
                <TableHead>Especialidade</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alocacaos.map((alocacao) => (
                <TableRow
                  key={alocacao.id}
                  className={"odd:bg-gray-100 even:bg-white"}
                >
                  <TableCell>{alocacao.id}</TableCell>
                  <TableCell>{alocacao.prestador.nome}</TableCell>
                  <TableCell>{alocacao.especialidade.nome}</TableCell>
                  <TableCell>{alocacao.unidade.nome}</TableCell>

                  <TableCell className="flex gap-3 justify-center">
                    <Tooltip.Provider>
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <Link
                            href={`/painel/alocacoes/editar/${alocacao.id}`}
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
                            Editar Alocação
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Totalizador de Alocacaos */}
          <div className="flex justify-between items-center ml-1 mt-4">
            <div className="text-sm text-gray-600">
              Mostrando {Math.min((paginaAtual + 1) * 5, totalAlocacaos)} de{" "}
              {totalAlocacaos} alocacaos
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

      {/* ✅ Diálogo de Confirmação
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Ação</DialogTitle>
          </DialogHeader>
          <p>
            Tem certeza que deseja{" "}
            {alocacaoSelecionado?.status === "Ativo" ? "inativar" : "ativar"}{" "}
            este alocacao?
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
              onClick={alterarStatusAlocacao}
              disabled={loadingInativar}
            >
              {loadingInativar ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : alocacaoSelecionado?.status === "Ativo" ? (
                "Inativar"
              ) : (
                "Ativar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}
    </div>
  );
}
