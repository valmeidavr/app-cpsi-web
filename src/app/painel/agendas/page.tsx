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

//Helpers
import { http } from "@/util/http";
import { format, formatDate, parseISO } from "date-fns";

//Types
import { Agenda } from "@/app/types/Agenda";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateAgenda } from "@/app/api/agendas/action";

export default function Agendas() {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalAgendas, setTotalAgendas] = useState(0);
  const [termoBusca, setTermoBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [agendaSelecionado, setAgendaSelecionado] = useState<Agenda | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingInativar, setLoadingInativar] = useState(false);
  const router = useRouter();
  const carregarAgendas = async () => {
    setCarregando(true);
    try {
      const { data } = await http.get("http://localhost:3000/agendas", {
        params: {
          page: paginaAtual + 1,
          limit: 5,
          search: termoBusca,
        },
      });
      setAgendas(data.data);
      setTotalPaginas(data.totalPages);
      setTotalAgendas(data.total);
    } catch (error) {
      console.error("Erro ao buscar agendas:", error);
    } finally {
      setCarregando(false);
    }
  };

  const form = useForm({
    resolver: zodResolver(
      z.object({
        situacao: z.enum(
          [
            "AGENDADO",
            "LIVRE",
            "INATIVO",
            "FALTA",
            "FINALIZADO",
            "BLOQUEADO",
            "CONFIRMADO",
          ],
          {
            required_error: "Situação é obrigatória",
            invalid_type_error: "Situação inválida",
          }
        ),
      })
    ),
    mode: "onChange",
    defaultValues: {
      situacao: undefined,
    },
  });
  const handleStatusAgendamentos = async (values: any) => {
    if (!agendaSelecionado) return;
    setLoadingInativar(true);
    try {
      await updateAgenda(agendaSelecionado.id.toString(), {
        situacao: values.situacao,
      });
      await carregarAgendas();
      toast.success("Situação Atualizada com sucesso!");
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Erro ao alterar situação da turma:", error);
    } finally {
      setLoadingInativar(false);
    }
  };

  useEffect(() => {
    carregarAgendas();

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
    carregarAgendas();
  };

  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Lista de Agendamentos" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-4 mt-5">Lista de Agendamentos</h1>
      {/* Barra de Pesquisa e Botão Novo Agenda */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Pesquisar agenda"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-96 max-w-lg"
          />
          <Button variant="secondary" onClick={handleSearch}>
            <Search className="w-4 h-4" />
            Buscar
          </Button>
        </div>

        {/* ✅ Botão Novo Agenda */}
        <Button asChild>
          <Link href="/painel/agendas/novo">
            <Plus className="h-5 w-5 mr-2" />
            Novo Agendamento
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
          {/* Tabela de Agendas */}
          <div className="overflow-x-auto rounded-md border border-gray-200">
            <Table className="text-xs min-w-[1200px] ">
              <TableHeader className="bg-gray-100 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="whitespace-nowrap">ID</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Convênio</TableHead>
                  <TableHead>Procedimento</TableHead>
                  <TableHead>Prestador</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead>Expediente Id</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="text-center uppercase">
                {agendas.map((agenda) => (
                  <TableRow
                    key={agenda.id}
                    className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <TableCell>{agenda.id}</TableCell>
                    <TableCell>
                      {format(parseISO(agenda.dtagenda), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      {agenda.clientes?.nome ? (
                        (() => {
                          const partes = agenda.clientes.nome.split(" ");
                          if (partes.length > 1) {
                            return `${partes[0]} ${partes[partes.length - 1]}`;
                          } else {
                            return `${partes[0]} `;
                          }
                        })()
                      ) : (
                        <span className="text-gray-400 italic">
                          Cliente não definido
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {" "}
                      {agenda.convenios?.nome ? (
                        (() => {
                          const partes = agenda.convenios.nome.split(" ");
                          if (partes.length > 1) {
                            return `${partes[0]} ${partes[partes.length - 1]}`;
                          } else {
                            return `${partes[0]} `;
                          }
                        })()
                      ) : (
                        <span className="text-gray-400 italic">
                          Convênio não definido
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {" "}
                      {agenda.procedimentos?.nome ? (
                        (() => {
                          const partes = agenda.procedimentos.nome.split(" ");
                          if (partes.length > 1) {
                            return `${partes[0]} ${partes[partes.length - 1]}`;
                          } else {
                            return `${partes[0]} `;
                          }
                        })()
                      ) : (
                        <span className="text-gray-400 italic">
                          Procedimento não definido
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {agenda.prestador?.nome ? (
                        (() => {
                          const partes = agenda.prestador.nome.split(" ");
                          if (partes.length > 1) {
                            return `${partes[0]} ${partes[partes.length - 1]}`;
                          } else {
                            return `${partes[0]} `;
                          }
                        })()
                      ) : (
                        <span className="text-gray-400 italic">
                          Prestador não definido
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {" "}
                      {agenda.unidade?.nome ? (
                        (() => {
                          const partes = agenda.unidade.nome.split(" ");
                          if (partes.length > 1) {
                            return `${partes[0]} ${partes[partes.length - 1]}`;
                          } else {
                            return `${partes[0]} `;
                          }
                        })()
                      ) : (
                        <span className="text-gray-400 italic">
                          Unidade não definido
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{agenda.especialidade?.nome || "-"}</TableCell>
                    <TableCell>{agenda.expedientesId}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${
                          agenda.situacao === "AGENDADO"
                            ? "bg-green-100 text-green-700"
                            : agenda.situacao == "FINALIZADO"
                            ? "bg-red-100 text-red-700"
                            : agenda.situacao == "LIVRE"
                            ? "bg-green-500 text-green-100"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {agenda.situacao}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <Link href={`/painel/agendas/editar/${agenda.id}`}>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="hover:bg-gray-200"
                              >
                                <Edit className="h-4 w-4 text-gray-600" />
                              </Button>
                            </Link>
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content
                              side="top"
                              className="bg-black text-white text-xs px-2 py-1 rounded shadow"
                            >
                              Editar Agenda
                            </Tooltip.Content>
                          </Tooltip.Portal>
                          <Tooltip.Trigger>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="hover:bg-gray-200"
                              onClick={() => {
                                setIsDialogOpen(true);
                                form.setValue("situacao", agenda.situacao);
                                setAgendaSelecionado(agenda);
                              }}
                            >
                              <Edit className="h-4 w-4 text-gray-600" />
                            </Button>
                            <Tooltip.Portal>
                              <Tooltip.Content
                                side="top"
                                className="bg-black text-white text-xs px-2 py-1 rounded shadow"
                              >
                                Mudar Status
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Trigger>
                        </Tooltip.Root>
                      </Tooltip.Provider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Totalizador de Agendas */}
          <div className="flex justify-between items-center ml-1 mt-4">
            <div className="text-sm text-gray-600">
              Mostrando {Math.min((paginaAtual + 1) * 5, totalAgendas)} de{" "}
              {totalAgendas} agendas
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <FormProvider {...form}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Ação</DialogTitle>
            </DialogHeader>
            <form>
              <FormField
                control={form.control}
                name="situacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Situação *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <FormControl
                        className={
                          form.formState.errors.situacao
                            ? "border-red-500"
                            : "border-gray-300"
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="AGENDADO">AGENDADO</SelectItem>
                        <SelectItem value="LIVRE">LIVRE</SelectItem>
                        <SelectItem value="INATIVO">INATIVO</SelectItem>
                        <SelectItem value="CONFIRMADO">CONFIRMADO</SelectItem>
                        <SelectItem value="BLOQUEADO">BLOQUEADO</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-500 text-sm mt-1" />
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
                  handleStatusAgendamentos(form.getValues());
                }}
                disabled={loadingInativar}
              >
                {loadingInativar ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Atualizar situação</span>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </FormProvider>
      </Dialog>
    </div>
  );
}
