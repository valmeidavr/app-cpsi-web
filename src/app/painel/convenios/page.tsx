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
import { TabelaFaturamento } from "@/app/types/TabelaFaturamento";
import { Convenio } from "@/app/types/Convenios";

// ✅ Definir o tipo convenio
export default function Convenios() {
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalconvenios, setTotalconvenios] = useState(0);
  const [termoBusca, setTermoBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [tabelaFaturamentos, setTabelaFaturamento] = useState<
    TabelaFaturamento[]
  >([]);

  const carregarConvenios = async () => {
    setCarregando(true);
    try {
      const { data } = await http.get("http://localhost:3000/convenios", {
        params: {
          page: paginaAtual + 1,
          limit: 5,
          search: termoBusca,
        },
      });
      console.log(data.data)
      setConvenios(data.data);
      setTotalPaginas(data.totalPages);
      setTotalconvenios(data.total);
    } catch (error) {
      console.error("Erro ao buscar convenios:", error);
    } finally {
      setCarregando(false);
    }
  };

  const fetchTabelaFaturamento = async () => {
    try {
      const { data } = await http.get("/tabela-faturamentos");
      setTabelaFaturamento(data.data);
    } catch (error: any) {}
  };

  useEffect(() => {
    fetchTabelaFaturamento();
    carregarConvenios();
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
    carregarConvenios();
  };

  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Lista de Convênios" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-4 mt-5">Lista de Convênios</h1>

      {/* Barra de Pesquisa e Botão Nova convenio */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Pesquisar convênio"
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
          <Link href="/painel/convenios/novo">
            <Plus className="h-5 w-5 mr-2" />
            Novo Convênio
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
          {/* Tabela de convenios */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-12-1">ID</TableHead>
                <TableHead className="h-12-1">Convênio</TableHead>
                <TableHead className="h-12-1">Regra</TableHead>
                <TableHead className="h-12-1">Tabela</TableHead>
                <TableHead className="h-12-1">Desconto(%)</TableHead>
                <TableHead className="h-12-1">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-center">
              {convenios.map((convenio) => (
                <TableRow
                  key={convenio.id}
                  className={"odd:bg-gray-100 even:bg-white"}
                >
                  <TableCell>{convenio.id}</TableCell>
                  <TableCell>{convenio.nome}</TableCell>
                  <TableCell>
                    <Badge>{convenio.regras}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="text-[13px]" variant="outline">
                      {tabelaFaturamentos
                        .filter(
                          (tabela) => tabela.id == convenio.tabelaFaturamentosId
                        )
                        .map((tabela) => (
                          <div key={tabela.id}>{tabela.nome}</div>
                        ))}
                    </Badge>
                  </TableCell>
                  <TableCell>{convenio.desconto}</TableCell>
                  <TableCell className="flex gap-3 justify-center">
                    <Tooltip.Provider>
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <Link
                            href={`/painel/convenios/editar/${convenio.id}`}
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
                            Editar Convênio
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {/* Totalizador de convenios */}
          <div className="flex justify-between items-center ml-1 mt-4">
            <div className="text-sm text-gray-600">
              Mostrando {Math.min((paginaAtual + 1) * 5, totalconvenios)} de{" "}
              {totalconvenios} convênios
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
