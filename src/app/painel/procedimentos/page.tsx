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

// ✅ Definir o tipo Procedimentos
interface Procedimento {
  id: number;
  // especialidadeId: number;
  nome: string;
  codigo: number;
  tipo: "SESSÃO" | "MENSAL";
  status: "Ativo" | "Inativo";
}

export default function Procedimentos() {
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalProcedimentos, setTotalProcedimentos] = useState(0);
  const [termoBusca, setTermoBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [procedimentoSelecionado, setProcedimentoSelecionado] =
    useState<Procedimento | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingInativar, setLoadingInativar] = useState(false);

  // Mockup de procedimentos
  const procedimento: Procedimento[] = [
    {
      id: 1,
      nome: "Radioterapia Convencional",
      codigo: 1001,
      tipo: "SESSÃO",
      status: "Ativo",
    },
    {
      id: 2,
      nome: "Holter cardiaco",
      codigo: 2002,
      tipo: "SESSÃO",
      status: "Ativo",
    },
    {
      id: 3,
      nome: "Fisioterapia Respiratória",
      codigo: 3050,
      tipo: "MENSAL",
      status: "Inativo",
    },
    {
      id: 4,
      nome: "Hemodiálise",
      codigo: 4100,
      tipo: "MENSAL",
      status: "Ativo",
    },
    {
      id: 5,
      nome: "Mapeamento de pressão",
      codigo: 5005,
      tipo: "SESSÃO",
      status: "Ativo",
    },
  ];

  // const carregarProcedimentos = async () => {
  //   setCarregando(true);
  //   try {
  //     const { data } = await http.get("/procedimentos", {
  //       params: {
  //         page: paginaAtual + 1,
  //         limit: 5,
  //         search: termoBusca,
  //       },
  //     });

  //     setProcedimentos(data.data);
  //     setTotalPaginas(data.totalPages);
  //     setTotalProcedimentos(data.total);
  //   } catch (error) {
  //     console.error("Erro ao buscar procedimentos:", error);
  //   } finally {
  //     setCarregando(false);
  //   }
  // };

  // // ✅ Atualiza status do procedimento (Ativo/Inativo)
  // const alterarStatusProcedimento = async () => {
  //   if (!procedimentoSelecionado) return;
  //   setLoadingInativar(true);
  //   const novoStatus =
  //     procedimentoSelecionado.status === "Ativo" ? "Inativo" : "Ativo";

  //   try {
  //     await http.patch(
  //       `http://localhost:3000/procedimentos/${procedimentoSelecionado.id}`,
  //       {
  //         status: novoStatus,
  //       }
  //     );
  //     setProcedimentos((procedimentos) =>
  //       procedimentos.map((procedimento) =>
  //         procedimento.id === procedimentoSelecionado.id
  //           ? { ...procedimento, status: novoStatus }
  //           : procedimento
  //       )
  //     );
  //     setIsDialogOpen(false);
  //   } catch (error) {
  //     console.error("Erro ao alterar status do procedimento:", error);
  //   } finally {
  //     setLoadingInativar(false);
  //   }
  // };

  useEffect(() => {
    // carregarProcedimentos();
  }, [paginaAtual]);

  const handleSearch = () => {
    setPaginaAtual(0);
    // carregarProcedimentos();
  };

  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Lista de Procedimentos" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-4 mt-5">Lista de Procedimentos</h1>

      {/* Barra de Pesquisa e Botão Novo Procedimento */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Pesquisar procedimento"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-96 max-w-lg"
          />
          <Button variant="secondary" onClick={handleSearch}>
            <Search className="w-4 h-4" />
            Buscar
          </Button>
        </div>

        {/* ✅ Botão Novo Procedimento */}
        <Button asChild>
          <Link href="/painel/procedimentos/novo">
            <Plus className="h-5 w-5 mr-2" />
            Novo Procedimento
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
          {/* Tabela de Procedimentos */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-12-1">ID</TableHead>
                <TableHead className="h-12-1">Procedimento</TableHead>
                <TableHead className="h-12-1">Código</TableHead>
                <TableHead className="h-12-1">Tipo</TableHead>
                <TableHead className="h-12-1">Status</TableHead>
                <TableHead className="h-12-1">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-center">
              {procedimento.map((procedimento) => (
                <TableRow
                  key={procedimento.id}
                  className={"odd:bg-gray-100 even:bg-white"}
                >
                  <TableCell>{procedimento.id}</TableCell>
                  <TableCell>{procedimento.nome}</TableCell>
                  <TableCell>{procedimento.codigo}</TableCell>
                  <TableCell>
                    <Badge>{procedimento.tipo}</Badge>
                  </TableCell>
                  <TableCell>{procedimento.status}</TableCell>
                  {/* <TableCell
                    className={`${
                      procedimento.status === "Ativo"
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {procedimento.status}
                  </TableCell> */}
                  <TableCell className="flex gap-3 justify-center">
                    {/* ✅ Botão Editar com Tooltip */}
                    {procedimento.status === "Ativo" && (
                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <Link
                              href={`/painel/procedimentos/editar/${procedimento.id}`}
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
                              Editar Procedimento
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
                              setProcedimentoSelecionado(procedimento);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Power
                              className={`h-5 w-5 ${
                                procedimento.status === "Ativo"
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
                            {procedimento.status === "Ativo"
                              ? "Inativar Procedimento"
                              : "Ativar Procedimento"}
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {/* Totalizador de Procedimentos */}
          <div className="flex justify-between items-center ml-1 mt-4">
            <div className="text-sm text-gray-600">
              Mostrando {Math.min((paginaAtual + 1) * 5, totalProcedimentos)} de{" "}
              {totalProcedimentos} procedimentos
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
            {procedimentoSelecionado?.status === "Ativo"
              ? "inativar"
              : "ativar"}{" "}
            esta procedimento?
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
              // onClick={alterarStatusProcedimento}
              disabled={loadingInativar}
            >
              {loadingInativar ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : procedimentoSelecionado?.status === "Ativo" ? (
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
