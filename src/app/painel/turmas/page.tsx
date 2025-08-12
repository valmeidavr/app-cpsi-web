"use client";

//React
import { useEffect, useState } from "react";
import ReactPaginate from "react-paginate";
import { FormProvider, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
//Zod

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
//Components
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
import Breadcrumb from "@/components/ui/Breadcrumb";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
//API
import { http } from "@/util/http";

//Helpers
// Removido import http - usando fetch direto
import { formatDate } from "date-fns";

//Types
import { Turma } from "@/app/types/Turma";
import AdicionarAlunosModal from "./_components/AdicionarAlunosModalComponent";


export default function Turmas() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalTurmas, setTotalTurmas] = useState(0);
  const [termoBusca, setTermoBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [turmaSelecionado, setTurmaSelecionado] = useState<Turma | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingInativar, setLoadingInativar] = useState(false);
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState<number>(0);

  const abrirAdicionarAlunosModal = (turmaId: number, open: boolean) => {
    setTurmaSelecionadaId(turmaId);
    setIsModalOpen(open);
  };
  const carregarTurmas = async () => {
    setCarregando(true);
    try {
      const params = new URLSearchParams({
        page: (paginaAtual + 1).toString(),
        limit: '5',
        search: termoBusca,
      });

      const response = await fetch(`/api/turmas?${params}`);
      const data = await response.json();

      if (response.ok) {
        setTurmas(data.data);
        setTotalPaginas(data.pagination.totalPages);
        setTotalTurmas(data.pagination.total);
      } else {
        console.error("Erro ao buscar turmas:", data.error);
      }
    } catch (error) {
      console.error("Erro ao buscar turmas:", error);
    } finally {
      setCarregando(false);
    }
  };

  const form = useForm({
    resolver: zodResolver(z.object({ dataFim: z.string().optional() })),
    mode: "onChange",
    defaultValues: {
      dataFim: "",
    },
  });

  const HandlefinalizarTurma = async (values: any) => {
    if (!turmaSelecionado) return;
    setLoadingInativar(true);
    try {
      await http.patch(`/api/turmas/${turmaSelecionado.id}`, { dataFim: values.dataFim });
      await carregarTurmas();
      toast.error("Turma finalizada com sucesso!");
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Erro ao alterar status do turma:", error);
    } finally {
      setLoadingInativar(false);
    }
  };

  useEffect(() => {
    carregarTurmas();
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
    carregarTurmas();
  };

  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Lista de Turmas" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-4 mt-5">Lista de Turmas</h1>

      {/* Barra de Pesquisa e Botão Novo Turma */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Pesquisar turma"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-96 max-w-lg"
          />
          <Button variant="secondary" onClick={handleSearch}>
            <Search className="w-4 h-4" />
            Buscar
          </Button>
        </div>

        {/* ✅ Botão Novo Turma */}
        <Button asChild>
          <Link href="/painel/turmas/novo">
            <Plus className="h-5 w-5 mr-2" />
            Nova Turma
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
          {/* Tabela de Turmas */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-12-1">ID</TableHead>
                <TableHead className="h-12-1">Turma</TableHead>
                <TableHead className="h-12-1">Procedimento</TableHead>
                <TableHead className="h-12-1">Profissional</TableHead>
                <TableHead className="h-12-1">Data Início</TableHead>
                <TableHead className="h-12-1">Data Fim</TableHead>
                <TableHead className="h-12-1">Vagas</TableHead>
                <TableHead className="h-12-1">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-center">
              {turmas.map((turma) => (
                <TableRow
                  key={turma.id}
                  className={"odd:bg-gray-100 even:bg-white"}
                >
                  <TableCell>{turma.id}</TableCell>
                  <TableCell>{turma.nome}</TableCell>
                  <TableCell>
                    <Badge className="text-[13px]" variant="outline">
                      {turma.procedimento_nome || (
                        <span className="text-gray-400 italic">
                          Procedimento não definido
                        </span>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="text-[13px]" variant="outline">
                      {turma.prestador_nome ? (
                        (() => {
                          const nomeArray = turma.prestador_nome.split(" ");
                          const primeiroUltimoNome = `${nomeArray[0]} ${
                            nomeArray[nomeArray.length - 1]
                          }`;
                          return primeiroUltimoNome;
                        })()
                      ) : (
                        <span className="text-gray-400 italic">
                          Prestador não definido
                        </span>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge>{formatDate(turma.dataInicio, "dd/MM/yyyy")}</Badge>
                  </TableCell>
                  <TableCell className={`${turma.dataFim ? "text-white" : ""}`}>
                    <Badge className={`${turma.dataFim ? "bg-red-500" : ""}`}>
                      {turma.dataFim
                        ? formatDate(turma.dataFim, "dd/MM/yyyy")
                        : "--------"}
                    </Badge>
                  </TableCell>
                  <TableCell>{turma.limiteVagas}</TableCell>
                  <TableCell className="flex gap-3 justify-center">
                    {/* ✅ Botão Editar com Tooltip */}

                    <Tooltip.Provider>
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <Button
                            size="icon"
                            variant="default"
                            onClick={() => {
                              abrirAdicionarAlunosModal(turma.id, true);
                            }}
                          >
                            <Plus className="h-5 w-5" />
                          </Button>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content
                            side="top"
                            className="bg-gray-700 text-white text-xs px-2 py-1 rounded-md shadow-md"
                          >
                            Adicionar Alunos
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                    <Tooltip.Provider>
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <Link href={`/painel/turmas/editar/${turma.id}`}>
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
                            Editar Turma
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                    {!turma.dataFim && (
                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => {
                                setTurmaSelecionado(turma);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Power
                                className={`h-5 w-5 ${
                                  turma.dataFim ?? "text-red-500"
                                }`}
                              />
                            </Button>
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content
                              side="top"
                              className="bg-gray-700 text-white text-xs px-2 py-1 rounded-md shadow-md"
                            >
                              Finalizar Turma
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </Tooltip.Provider>
                    )}
                    {/* ✅ Botão Ativar/Inativar com Tooltip */}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Totalizador de Turmas */}
          <div className="flex justify-between items-center ml-1 mt-4">
            <div className="text-sm text-gray-600">
              Mostrando {Math.min((paginaAtual + 1) * 5, totalTurmas)} de{" "}
              {totalTurmas} turmas
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
        <FormProvider {...form}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Ação</DialogTitle>
            </DialogHeader>
            <p>Tem certeza que deseja finalizar esta turma?</p>
            <form>
              <FormField
                control={form.control}
                name="dataFim"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.dataFim?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
            </form>
            <DialogFooter>
              <Button
                variant="secondary"
                onClick={() => setIsDialogOpen(false)}
                disabled={loadingInativar}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="default"
                onClick={() => {
                  HandlefinalizarTurma(form.getValues());
                }}
                disabled={loadingInativar}
              >
                {loadingInativar ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Finalizar</span>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </FormProvider>
      </Dialog>

      <AdicionarAlunosModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        turmaId={turmaSelecionadaId}
      />
    </div>
  );
}
