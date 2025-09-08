"use client";
import { useEffect, useState } from "react";
import ReactPaginate from "react-paginate";
import Link from "next/link";
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
import { Loader2, Search, Edit, Power, Plus } from "lucide-react";
import { toast } from "sonner";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Caixa } from "@/app/types/Caixa";
export default function Caixas() {
  const [caixa, setCaixa] = useState<Caixa[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalCaixas, setTotalCaixas] = useState(0);
  const [termoBusca, setTermoBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const carregarCaixas = async () => {
    setCarregando(true);
    try {
      const params = new URLSearchParams({
        page: (paginaAtual + 1).toString(),
        limit: '5',
        search: termoBusca,
      });
      const response = await fetch(`/api/caixa?${params}`);
      const data = await response.json();
      if (response.ok) {
        setCaixa(data.data);
        setTotalPaginas(data.pagination.totalPages);
        setTotalCaixas(data.pagination.total);
      } else {
      }
    } catch (error) {
    } finally {
      setCarregando(false);
    }
  };
  useEffect(() => {
    carregarCaixas();
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
    carregarCaixas();
  };
  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: " Lista de Caixas" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-4 mt-5">Lista de Caixas</h1>
      {}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Pesquisar Caixa"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-96 max-w-lg"
          />
          <Button variant="secondary" onClick={handleSearch}>
            <Search className="w-4 h-4" />
            Buscar
          </Button>
        </div>
        {}
        <Button asChild>
          <Link href="/painel/caixas/novo">
            <Plus className="h-5 w-5 mr-2" />
            Novo Caixa
          </Link>
        </Button>
      </div>
      {}
      {carregando ? (
        <div className="flex justify-center items-center w-full h-40">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Carregando ...</span>
        </div>
      ) : (
        <>
          {}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-12-1">ID</TableHead>
                <TableHead className="h-12-1">Caixa</TableHead>
                <TableHead className="h-12-1">Saldo</TableHead>
                <TableHead className="h-12-1">Tipo</TableHead>
                <TableHead className="h-12-1">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-center">
              {caixa.map((caixas) => (
                <TableRow
                  key={caixas.id}
                  className={"odd:bg-gray-100 even:bg-white"}
                >
                  <TableCell>{caixas.id}</TableCell>
                  <TableCell>{caixas.nome}</TableCell>
                  <TableCell>
                    <Badge
                      className={`${
                        caixas.saldo <= 0 ? "bg-destructive" : "bg-green-500"
                      }`}
                    >
                      {caixas.saldo}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge>{caixas.tipo}</Badge>
                  </TableCell>
                  <TableCell className="flex gap-3 justify-center">
                    <Tooltip.Provider>
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <Link href={`/painel/caixas/editar/${caixas.id}`}>
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
                            Editar Caixa
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
              Mostrando {Math.min((paginaAtual + 1) * 5, totalCaixas)} de{" "}
              {totalCaixas} caixas
            </div>
          </div>
          {}
          {}
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