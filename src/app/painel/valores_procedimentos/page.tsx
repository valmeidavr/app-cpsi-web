"use client";

//React
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
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
import { Loader2, Edit, Trash2 } from "lucide-react";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "date-fns";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
//Helpers
import { http } from "@/util/http";
//API

import { ValorProcedimento } from "@/app/types/ValorProcedimento";
import {
  createValorProcedimento,
  finalizarValorProcedimento,
  updateValorProcedimento,
} from "@/app/api/valor-procedimento/action";
import { Procedimento } from "@/app/types/Procedimento";
import { TabelaFaturamento } from "@/app/types/TabelaFaturamento";
import {
  createValorProcedimentoSchema,
  updateValorProcedimentoSchema,
} from "@/app/api/valor-procedimento/schema/formSchemaValorProcedimento";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatValor } from "@/app/helpers/format";

export default function ValorProcedimentos() {
  const [valorProcedimentos, setValorProcedimentos] = useState<
    ValorProcedimento[]
  >([]);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalValorProcedimentos, setTotalValorProcedimentos] = useState(0);
  const [termoBusca, setTermoBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [valorProcedimentoSelecionado, setValorProcedimentoSelecionado] =
    useState<ValorProcedimento | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingInativar, setLoadingInativar] = useState(false);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [tabelaFaturamentos, setTabelaFaturamentos] = useState<
    TabelaFaturamento[]
  >([]);

  const [procedimentoSelecionado, setProcedimentoSelecionado] =
    useState<Procedimento | null>();

  const [tabelaSelecionado, setTabelaSelecionado] =
    useState<TabelaFaturamento | null>();

  useEffect(() => {
    carregarValorProcedimentos();
  }, [tabelaSelecionado, procedimentoSelecionado]);

  const carregarValorProcedimentos = async (filters?: any) => {
    setCarregando(true);
    try {
      if (!tabelaSelecionado) return;
      const params: any = {
        page: paginaAtual + 1,
        limit: 5,
        search: termoBusca,
        tabelaFaturamentosId: tabelaSelecionado.id,
        procedimentosId: procedimentoSelecionado
          ? procedimentoSelecionado.id
          : "",
      };
      const { data } = await http.get(
        "http://localhost:3000/valores-procedimentos",
        {
          params,
        }
      );

      setValorProcedimentos(data.data);
      setTotalPaginas(data.totalPages);
      setTotalValorProcedimentos(data.total);
    } catch (error) {
      console.error("Erro ao buscar lançamentos:", error);
    } finally {
      setCarregando(false);
    }
  };

  const form = useForm({
    resolver: zodResolver(createValorProcedimentoSchema),
    mode: "onChange",
    defaultValues: {
      tabelaFaturamentosId: 0,
      procedimentosId: 0,
      valor: 0,
      tipo: undefined,
    },
  });

  const formUpdate = useForm({
    resolver: zodResolver(updateValorProcedimentoSchema),
    mode: "onChange",
    defaultValues: {
      tabelaFaturamentosId: 0,
      procedimentosId: 0,
      valor: 0,
      tipo: undefined,
    },
  });

  useEffect(() => {
    async function fetchData() {
      setCarregando(true);
      try {
        if (!valorProcedimentoSelecionado) return;

        formUpdate.reset({
          tabelaFaturamentosId:
            valorProcedimentoSelecionado.tabelaFaturamentosId,
          procedimentosId: valorProcedimentoSelecionado.procedimentosId,
          valor: +valorProcedimentoSelecionado.valor,
          tipo: valorProcedimentoSelecionado.tipo,
        });
      } catch (error) {
        console.error("Erro ao carregar valor procedimento:", error);
      } finally {
        setCarregando(false);
      }
    }
    fetchData();
  }, [valorProcedimentoSelecionado]);

  const tipos = ["SOCIO", "NSOCIO", "PARCEIRO", "FUNCIONARIO"];

  const fetchProcedimentos = async () => {
    try {
      const { data } = await http.get("http://localhost:3000/Procedimentos");

      setProcedimentos(data.data);
    } catch (error: any) {}
  };
  const fetchTabelaFaturamentos = async () => {
    try {
      const { data } = await http.get(
        "http://localhost:3000/tabela-faturamentos"
      );
      setTabelaFaturamentos(data.data);
    } catch (error: any) {}
  };

  useEffect(() => {
    fetchProcedimentos();
    fetchTabelaFaturamentos();
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

  const onSubmit = async (
    values: z.infer<typeof createValorProcedimentoSchema>
  ) => {
    setCarregando(true);
    try {
      await createValorProcedimento(values);
      await carregarValorProcedimentos();
    } catch (error) {
      toast.error("Erro ao salvar valor procedimento");
    } finally {
      setCarregando(false);
    }
  };

  const handleDeleteValor = async (valorId: number) => {
    setCarregando(true);
    try {
      await finalizarValorProcedimento(valorId);
      await carregarValorProcedimentos();
    } catch (error) {
      toast.error("Erro ao deletar valor procedimento");
    } finally {
      setCarregando(false);
    }
  };

  const onSubmitUpdate = async (
    values: z.infer<typeof updateValorProcedimentoSchema>
  ) => {
    setCarregando(true);
    try {
      if (!valorProcedimentoSelecionado) return;
      await updateValorProcedimento(valorProcedimentoSelecionado.id, values);
      await carregarValorProcedimentos();
      setIsDialogOpen(false)
    } catch (error) {
      toast.error("Erro ao atualizar valor procedimento");
    } finally {
      setCarregando(false);
    }
  };
  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Lista de Valor de Procedimentos" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-4 mt-5">
        Lista de Valor de Procedimentos
      </h1>

      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-2 items-end">
            <FormField
              control={form.control}
              name="tabelaFaturamentosId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tabela *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setTabelaSelecionado(
                        tabelaFaturamentos.find((item) => item.id == +value) ??
                          null
                      );
                    }}
                    value={field.value.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Selecione</SelectItem>
                      {tabelaFaturamentos.map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500 text-sm mt-1">
                    {form.formState.errors.tabelaFaturamentosId?.message}
                  </FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="procedimentosId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Procedimentos *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setProcedimentoSelecionado(
                        procedimentos.find((item) => item.id == +value) ?? null
                      );
                    }}
                    value={field.value.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Selecione</SelectItem>
                      {procedimentos.map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500 text-sm mt-1">
                    {form.formState.errors.procedimentosId?.message}
                  </FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo Cliente *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                    }}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Selecione</SelectItem>
                      {tipos.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500 text-sm mt-1">
                    {form.formState.errors.tipo?.message}
                  </FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="valor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$) *</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      value={field.value || ""}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, "");
                        value = "R$" + (Number(value) / 100).toFixed(2) + "";
                        field.onChange(value.replace(".", ","));
                      }}
                      placeholder="R$ 0,00"
                      className={
                        form.formState.errors.valor
                          ? "border-red-500"
                          : "border-gray-300"
                      }
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm mt-1">
                    {form.formState.errors.valor?.message}
                  </FormMessage>
                </FormItem>
              )}
            />
            <Button variant={"default"} type="submit">
              Salvar
            </Button>
          </div>
        </form>
      </Form>
      {/* Loader - Oculta a Tabela enquanto carrega */}
      {carregando ? (
        <div className="flex justify-center items-center w-full h-40">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Carregando ...</span>
        </div>
      ) : (
        <>
          {valorProcedimentos.length === 0 ? (
            <div className="flex justify-center items-center w-full h-40">
              <span className="ml-2 text-gray-500">
                Nenhuma valor encontrado ...
              </span>
            </div>
          ) : (
            <Table className="mt-8">
              <TableHeader>
                <TableRow>
                  <TableHead className="h-12-1">ID</TableHead>
                  <TableHead className="h-12-1">Procedimento</TableHead>
                  <TableHead className="h-12-1">Valor</TableHead>
                  <TableHead className="h-12-1">Tipo</TableHead>
                  <TableHead className="h-12-1">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-center">
                {valorProcedimentos.map((valorProcedimento) => (
                  <TableRow
                    key={valorProcedimento.id}
                    className={"odd:bg-gray-100 even:bg-white"}
                  >
                    <TableCell>{valorProcedimento.id}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {valorProcedimento.procedimento.nome}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatValor(valorProcedimento.valor)}</TableCell>
                    <TableCell>{valorProcedimento.tipo}</TableCell>
                    <TableCell className="flex gap-3 justify-center">
                      {/* ✅ Botão Editar com Tooltip */}

                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => {
                                setValorProcedimentoSelecionado({
                                  ...valorProcedimento,
                                });
                                setIsDialogOpen(true);
                              }}
                            >
                              <Edit className="h-5 w-5" />
                            </Button>
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content
                              side="top"
                              className="bg-gray-700 text-white text-xs px-2 py-1 rounded-md shadow-md"
                            >
                              Editar Valor Procedimento
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </Tooltip.Provider>
                      {/* ✅ Botão Editar com Tooltip */}

                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={() => {
                                handleDeleteValor(valorProcedimento.id);
                              }}
                            >
                              <Trash2 className="h-5 w-5 " />
                            </Button>
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content
                              side="top"
                              className="bg-gray-700 text-white text-xs px-2 py-1 rounded-md shadow-md"
                            >
                              Deletar Valor Procedimento
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </Tooltip.Provider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {/* Totalizador de ValorProcedimentos */}
          <div className="flex justify-between items-center ml-1 mt-4">
            <div className="text-sm text-gray-600">
              Mostrando{" "}
              {Math.min((paginaAtual + 1) * 5, totalValorProcedimentos)} de{" "}
              {totalValorProcedimentos} lançamentos
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
        <FormProvider {...formUpdate}>
          <DialogContent className="w-full max-w-2xl">
            <DialogHeader>
              <DialogTitle>Confirmar Ação</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={formUpdate.handleSubmit(onSubmitUpdate)}
            >
              <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-2">
                <FormField
                  control={formUpdate.control}
                  name="tabelaFaturamentosId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tabela *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setTabelaSelecionado(
                            tabelaFaturamentos.find(
                              (item) => item.id == +value
                            ) ?? null
                          );
                        }}
                        value={field.value ? field.value.toString() : ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Selecione</SelectItem>
                          {tabelaFaturamentos.map((item) => (
                            <SelectItem
                              key={item.id}
                              value={item.id.toString()}
                            >
                              {item.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-500 text-sm mt-1">
                        {
                          formUpdate.formState.errors.tabelaFaturamentosId
                            ?.message
                        }
                      </FormMessage>
                    </FormItem>
                  )}
                />
                <FormField
                  control={formUpdate.control}
                  name="procedimentosId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Procedimentos *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setProcedimentoSelecionado(
                            procedimentos.find((item) => item.id == +value) ??
                              null
                          );
                        }}
                        value={field.value ? field.value.toString() : ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Selecione</SelectItem>
                          {procedimentos.map((item) => (
                            <SelectItem
                              key={item.id}
                              value={item.id.toString()}
                            >
                              {item.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-500 text-sm mt-1">
                        {formUpdate.formState.errors.procedimentosId?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />
                <FormField
                  control={formUpdate.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo Cliente *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                        }}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Selecione</SelectItem>
                          {tipos.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-500 text-sm mt-1">
                        {formUpdate.formState.errors.tipo?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />
                <FormField
                  control={formUpdate.control}
                  name="valor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor (R$) *</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          value={field.value || ""}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, "");
                            value =
                              "R$" + (Number(value) / 100).toFixed(2) + "";
                            field.onChange(value.replace(".", ","));
                          }}
                          placeholder="R$ 0,00"
                          className={
                            formUpdate.formState.errors.valor
                              ? "border-red-500"
                              : "border-gray-300"
                          }
                        />
                      </FormControl>
                      <FormMessage className="text-red-500 text-sm mt-1">
                        {formUpdate.formState.errors.valor?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  variant="secondary"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={carregando}
                >
                  Cancelar
                </Button>
                {carregando ? (
                  <Loader2></Loader2>
                ) : (
                  <Button type="submit" variant="default" disabled={carregando}>
                    <span>Atualizar</span>
                  </Button>
                )}
              </DialogFooter>
            </form>
          </DialogContent>
        </FormProvider>
      </Dialog>
    </div>
  );
}
