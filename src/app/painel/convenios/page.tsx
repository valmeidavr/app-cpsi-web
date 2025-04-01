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

//Helpers
import { http } from "@/util/http";
import { TabelaFaturamentoDTO } from "@/app/types/TabelaFaturamento";

// ✅ Definir o tipo convenio
interface convenio {
  id: number;
  nome: string;
  regras: string;
  tabelaFaturamentosId: number;
}

export default function Convenios() {
  const [convenios, setConvenios] = useState<convenio[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalconvenios, setTotalconvenios] = useState(0);
  const [termoBusca, setTermoBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [tabelaFaturamentos, setTabelaFaturamento] = useState<
    TabelaFaturamentoDTO[]
  >([]);

  const carregarConvenios = async () => {
    setCarregando(true);
    try {
      const { data } = await http.get("/convenios", {
        params: {
          page: paginaAtual + 1,
          limit: 5,
          search: termoBusca,
        },
      });
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
          { label: "Lista de convenios" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-4 mt-5">Lista de convenios</h1>

      {/* Barra de Pesquisa e Botão Nova convenio */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Pesquisar convenio"
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
            Nova convenio
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
                <TableHead className="h-12-1 flex items-center justify-start">
                  Convênio
                </TableHead>
                <TableHead className="h-12-1">Regra</TableHead>
                <TableHead className="h-12-1">Tabela</TableHead>
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
                  <TableCell className="flex items-center justify-start">
                    {convenio.nome}
                  </TableCell>
                  <TableCell>{convenio.regras}</TableCell>
                  {tabelaFaturamentos
                    .filter(
                      (tabela) => tabela.id == convenio.tabelaFaturamentosId
                    )
                    .map((tabela) => (
                      <TableCell key={tabela.id}>{tabela.nome}</TableCell>
                    ))}

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
              {totalconvenios} convenios
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
