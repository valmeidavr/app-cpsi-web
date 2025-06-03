"use client";

//React
import { useEffect, useState } from "react";
import ReactPaginate from "react-paginate";
import Link from "next/link";
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
import { toast } from "sonner";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { Badge } from "@/components/ui/badge";

//Helpers
import { http } from "@/util/http";

//Types
import { PlanoConta } from "@/app/types/PlanoConta";

// ✅ Definir o tipo Plano de conta
export default function PlanoContas() {
  const [planoContas, setPlanoContas] = useState<PlanoConta[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalplano, setTotalplano] = useState(0);
  const [termoBusca, setTermoBusca] = useState("");
  const [carregando, setCarregando] = useState(false);

  const carregarPlanoContas = async () => {
    setCarregando(true);
    try {
      const { data } = await http.get("https://api-cpsi.aapvr.com.br//plano-contas", {
        params: {
          page: paginaAtual + 1,
          limit: 5,
          search: termoBusca,
        },
      });
      setPlanoContas(data.data);
      setTotalPaginas(data.totalPages);
      setTotalplano(data.total);
    } catch (error) {
      console.error("Erro ao buscar Plano de conta:", error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarPlanoContas();
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
    carregarPlanoContas();
  };

  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Planos de Conta" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-4 mt-5">Planos de Conta</h1>

      {/* Barra de Pesquisa e Botão Novo Plano de conta */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Pesquisar Plano"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-96 max-w-lg"
          />
          <Button variant="secondary" onClick={handleSearch}>
            <Search className="w-4 h-4" />
            Buscar
          </Button>
        </div>

        {/* ✅ Botão Novo Plano */}
        <Button asChild>
          <Link href="/painel/plano_contas/novo">
            <Plus className="h-5 w-5 mr-2" />
            Novo Plano
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
          {/* Tabela de plano_contas */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-12-1">ID</TableHead>
                <TableHead className="h-12-1">Plano</TableHead>
                <TableHead className="h-12-1">Tipo</TableHead>
                <TableHead className="h-12-1">Categoria</TableHead>
                <TableHead className="h-12-1">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-center">
              {planoContas.map((plano_conta) => (
                <TableRow
                  key={plano_conta.id}
                  className={"odd:bg-gray-100 even:bg-white"}
                >
                  <TableCell>{plano_conta.id}</TableCell>
                  <TableCell>{plano_conta.nome}</TableCell>
                  <TableCell>
                    <Badge
                      className={`${
                        plano_conta.tipo === "ENTRADA"
                          ? "bg-green-500"
                          : "bg-destructive"
                      }`}
                    >
                      {plano_conta.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="text-[13px]" variant="default">
                      {plano_conta.categoria}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-3 justify-center">
                    <Tooltip.Provider>
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <Link
                            href={`/painel/plano_contas/editar/${plano_conta.id}`}
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
                            Editar Plano
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {/* Totalizador de Planos de conta */}
          <div className="flex justify-between items-center ml-1 mt-4">
            <div className="text-sm text-gray-600">
              Mostrando {Math.min((paginaAtual + 1) * 5, totalplano)} de{" "}
              {totalplano} planos
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
    </div>
  );
}
