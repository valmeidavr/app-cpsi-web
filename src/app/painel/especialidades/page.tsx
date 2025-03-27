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
import { Loader2, Search, Edit, Power, Plus } from "lucide-react";
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

// ✅ Definir o tipo Especialidade
interface Especialidade {
  id: number;
  nome: string;
  codigo: string;
  status: "Ativo" | "Inativo";
}

export default function Especialidades() {
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalEspecialidades, setTotalEspecialidades] = useState(0);
  const [termoBusca, setTermoBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [especialidadeSelecionada, setEspecialidadeSelecionada] =
    useState<Especialidade | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingInativar, setLoadingInativar] = useState(false);

  // const carregarEspecialidades = async () => {
  //   setCarregando(true);
  //   try {
  //     const { data } = await http.get("especialidades", {
  //       params: {
  //         page: paginaAtual + 1,
  //         limit: 5,
  //         search: termoBusca,
  //       },
  //     });

  //     setEspecialidades(data.data);
  //     setTotalPaginas(data.totalPages);
  //     setTotalEspecialidades(data.total);
  //   } catch (error) {
  //     console.error("Erro ao buscar especialidades:", error);
  //   } finally {
  //     setCarregando(false);
  //   }
  // };

  // ✅ Atualiza status da especialidade (Ativo/Inativo)
  const alterarStatusEspecialidade = async () => {
    if (!especialidadeSelecionada) return;
    setLoadingInativar(true);
    const novoStatus =
      especialidadeSelecionada.status === "Ativo" ? "Inativo" : "Ativo";

    try {
      await http.patch(`/especialidades/${especialidadeSelecionada.id}`, {
        status: novoStatus,
      });
      setEspecialidades((especialidades) =>
        especialidades.map((especialidade) =>
          especialidade.id === especialidadeSelecionada.id
            ? { ...especialidade, status: novoStatus }
            : especialidade
        )
      );
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Erro ao alterar status da especialidade:", error);
    } finally {
      setLoadingInativar(false);
    }
  };

  const especialidade: Especialidade[] = [
    { id: 1, codigo: "100245", nome: "DERMATOLOGISTA", status: "Ativo" },
    { id: 2, codigo: "205301", nome: "CARDIOLOGISTA", status: "Ativo" },
    { id: 3, codigo: "213150", nome: "FÍSICO MÉDICO", status: "Ativo" },
    { id: 4, codigo: "402154", nome: "PEDIATRA", status: "Ativo" },
    { id: 5, codigo: "223505", nome: "ENFERMAGEM", status: "Ativo" },
    { id: 6, codigo: "601234", nome: "NEUROLOGISTA", status: "Ativo" },
    { id: 7, codigo: "703452", nome: "GINECOLOGISTA", status: "Ativo" },
    { id: 8, codigo: "808765", nome: "ONCOLOGISTA", status: "Ativo" },
    { id: 9, codigo: "905678", nome: "RADIOLOGISTA", status: "Ativo" },
    { id: 10, codigo: "102345", nome: "ANESTESIOLOGISTA", status: "Ativo" },
  ];

  useEffect(() => {
    // carregarEspecialidades()
    especialidade;
  }, [paginaAtual]);

  const handleSearch = () => {
    setPaginaAtual(0);
    especialidade;
    // carregarEspecialidades();
  };

  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Especialidades" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-4 mt-5">Especialidades</h1>

      {/* Barra de Pesquisa e Botão Nova Especialidade */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Pesquisar especialidade"
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
          <Link href="/painel/especialidades/novo">
            <Plus className="h-5 w-5 mr-2" />
            Nova Especialidade
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
          {/* Tabela de Especialidades */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-12-1">ID</TableHead>
                <TableHead className="h-12-1">Especialidade</TableHead>
                <TableHead className="h-12-1">Código</TableHead>
                <TableHead className="h-12-1">Status</TableHead>
                <TableHead className="h-12-1">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-center">
              {especialidade.map((especialidade) => (
                <TableRow
                  key={especialidade.id}
                  className={"odd:bg-gray-100 even:bg-white"}
                >
                  <TableCell>{especialidade.id}</TableCell>
                  <TableCell>{especialidade.nome}</TableCell>
                  <TableCell>{especialidade.codigo}</TableCell>
                  <TableCell>{especialidade.status}</TableCell>
                  <TableCell className="flex gap-3 justify-center">
                    {/* ✅ Botão Editar com Tooltip */}
                    {especialidade.status === "Ativo" && (
                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <Link
                              href={`/painel/especialidades/editar/${especialidade.id}`}
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
                              Editar Especialidade
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
                              setEspecialidadeSelecionada(especialidade);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Power
                              className={`h-5 w-5 ${
                                especialidade.status === "Ativo"
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
                            {especialidade.status === "Ativo"
                              ? "Inativar Especialidade"
                              : "Ativar Especialidade"}
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
              Mostrando {Math.min((paginaAtual + 1) * 5, totalEspecialidades)}{" "}
              de {totalEspecialidades} especialidades
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

      {/* ✅ Diálogo de Confirmação */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Ação</DialogTitle>
          </DialogHeader>
          <p>
            Tem certeza que deseja{" "}
            {especialidadeSelecionada?.status === "Ativo"
              ? "inativar"
              : "ativar"}{" "}
            esta especialidade?
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
              // onClick={alterarStatusEspecialidade}
              disabled={loadingInativar}
            >
              {loadingInativar ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : especialidadeSelecionada?.status === "Ativo" ? (
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
