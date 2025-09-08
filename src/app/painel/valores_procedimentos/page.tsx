"use client";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import ReactPaginate from "react-paginate";
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
import { ValorProcedimento } from "@/app/types/ValorProcedimento";
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
  const valorProcedimentosSeguro = Array.isArray(valorProcedimentos) ? valorProcedimentos : [];
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalValorProcedimentos, setTotalValorProcedimentos] = useState(0);
  const [termoBusca, setTermoBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [valorProcedimentoSelecionado, setValorProcedimentoSelecionado] =
    useState<ValorProcedimento | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [tabelaFaturamentos, setTabelaFaturamentos] = useState<
    TabelaFaturamento[]
  >([]);
  const [procedimentoSelecionado, setProcedimentoSelecionado] =
    useState<Procedimento | null>();
  const [tabelaSelecionado, setTabelaSelecionado] =
    useState<TabelaFaturamento | null>();
  const [convenios, setConvenios] = useState<{ id: number; nome: string }[]>([]);
  const [convenioSelecionado, setConvenioSelecionado] = useState<{ id: number; nome: string } | null>(null);
  const [tipoClienteSelecionado, setTipoClienteSelecionado] = useState<string>("SOCIO");
  useEffect(() => {
    if (tabelaSelecionado && convenioSelecionado) {
      carregarValorProcedimentos();
    } else {
      setValorProcedimentos([]);
      setTotalPaginas(0);
      setTotalValorProcedimentos(0);
    }
  }, [tabelaSelecionado, convenioSelecionado, procedimentoSelecionado]);
  const carregarValorProcedimentos = async (filters?: {
    page?: number;
    limit?: number;
    search?: string;
    tabela_faturamento_id?: number;
    procedimento_id?: number;
  }) => {
    setCarregando(true);
    try {
      if (!tabelaSelecionado || !convenioSelecionado) {
        setValorProcedimentos([]);
        setTotalPaginas(0);
        setTotalValorProcedimentos(0);
        return;
      }
      const params = new URLSearchParams();
      params.append('page', (paginaAtual + 1).toString());
      params.append('limit', '5');
      params.append('search', termoBusca);
      params.append('tabela_faturamento_id', tabelaSelecionado.id.toString());
      if (procedimentoSelecionado) {
        params.append('procedimento_id', procedimentoSelecionado.id.toString());
      }
      const response = await fetch(`/api/valor-procedimento?${params}`);
      const data = await response.json();
              if (response.ok) {
          if (data.data && Array.isArray(data.data)) {
            const dadosValidos = data.data.filter((item: { id: number; procedimento: { nome: string } }) => 
              item && item.id && item.procedimento && item.procedimento.nome
            );
          setValorProcedimentos(dadosValidos);
          setTotalPaginas(data.pagination?.totalPages || 1);
          setTotalValorProcedimentos(data.pagination?.total || 0);
        } else {
          setValorProcedimentos([]);
          setTotalPaginas(0);
          setTotalValorProcedimentos(0);
        }
      } else {
        setValorProcedimentos([]);
        setTotalPaginas(0);
        setTotalValorProcedimentos(0);
      }
    } catch (error) {
    } finally {
      setCarregando(false);
    }
  };
  const form = useForm({
    resolver: zodResolver(createValorProcedimentoSchema),
    mode: "onChange",
    defaultValues: {
      convenio_id: 0,
      tipo_cliente: "SOCIO",
      tabela_faturamento_id: 0,
      procedimento_id: 0,
      valor: 0,
    },
  });
  const formUpdate = useForm({
    resolver: zodResolver(updateValorProcedimentoSchema),
    mode: "onChange",
    defaultValues: {
      convenio_id: 0,
      tipo_cliente: "SOCIO",
      tabela_faturamento_id: 0,
      procedimento_id: 0,
      valor: 0,
    },
  });
  useEffect(() => {
    async function fetchData() {
      setCarregando(true);
      try {
        if (!valorProcedimentoSelecionado) return;
        formUpdate.reset({
          convenio_id: 0, // Será preenchido quando implementarmos a busca reversa
          tipo: valorProcedimentoSelecionado.tipo,
          tabela_faturamento_id:
            valorProcedimentoSelecionado.tabela_faturamento_id,
          procedimento_id: valorProcedimentoSelecionado.procedimento_id,
          valor: +valorProcedimentoSelecionado.valor,
        });
      } catch (error) {
      } finally {
        setCarregando(false);
      }
    }
    fetchData();
  }, [valorProcedimentoSelecionado]);
  const fetchProcedimentos = async () => {
    try {
      const response = await fetch("/api/procedimentos");
      const data = await response.json();
      if (response.ok) {
        setProcedimentos(data.data);
      } else {
        setProcedimentos([]);
      }
    } catch (error) {
      setProcedimentos([]);
    }
  };
  const fetchTabelaFaturamentos = async () => {
    try {
      const response = await fetch("/api/tabela_faturamentos");
      const data = await response.json();
      if (response.ok) {
        setTabelaFaturamentos(data.data);
      } else {
      }
    } catch (error) {
    }
  };
  const fetchConvenios = async () => {
    try {
      const response = await fetch("/api/convenios");
      const data = await response.json();
      if (response.ok) {
        setConvenios(data.data);
      } else {
      }
    } catch (error) {
    }
  };
  useEffect(() => {
    fetchProcedimentos();
    fetchTabelaFaturamentos();
    fetchConvenios();
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
  }, []); // Removido paginaAtual para carregar apenas uma vez
  useEffect(() => {
    if (tabelaSelecionado && convenioSelecionado) {
      carregarValorProcedimentos();
    }
  }, [paginaAtual]);
  const onSubmit = async (
    values: z.infer<typeof createValorProcedimentoSchema>
  ) => {
    setCarregando(true);
    try {
      const dadosParaEnviar = {
        ...values,
        tipo: values.tipo_cliente,
        convenio_id: undefined,
        tipo_cliente: undefined
      };
      const response = await fetch("/api/valor-procedimento", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosParaEnviar),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Valor de procedimento criado com sucesso");
        await carregarValorProcedimentos();
        form.reset({
          convenio_id: 0,
          tipo_cliente: "SOCIO",
          tabela_faturamento_id: 0,
          procedimento_id: 0,
          valor: 0,
        });
        setConvenioSelecionado(null);
        setProcedimentoSelecionado(null);
        setTabelaSelecionado(null);
      } else {
        toast.error(data.error || "Erro ao criar valor de procedimento");
      }
    } catch (error) {
      toast.error("Erro ao criar valor de procedimento");
    } finally {
      setCarregando(false);
    }
  };
  const handleDeleteValor = async (valorId: number) => {
    if (!confirm("Tem certeza que deseja deletar este valor de procedimento?")) {
      return;
    }
    setCarregando(true);
    try {
      const response = await fetch(`/api/valor-procedimento?id=${valorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: "Inativo" }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || "Valor de procedimento deletado com sucesso");
        await carregarValorProcedimentos();
      } else {
        toast.error(data.error || "Erro ao deletar valor de procedimento");
      }
    } catch (error) {
      toast.error("Erro ao deletar valor de procedimento");
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
      const updateData: {
        valor?: number;
        tipo?: string;
        tabela_faturamento_id?: number;
        procedimento_id?: number;
      } = {};
      if (values.valor !== undefined) updateData.valor = values.valor;
      if (values.tipo_cliente !== undefined) updateData.tipo = values.tipo_cliente;
      if (values.tabela_faturamento_id !== undefined) updateData.tabela_faturamento_id = values.tabela_faturamento_id;
      if (values.procedimento_id !== undefined) updateData.procedimento_id = values.procedimento_id;
      const response = await fetch(`/api/valor-procedimento?id=${valorProcedimentoSelecionado.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || "Valor de procedimento atualizado com sucesso");
        await carregarValorProcedimentos();
        setIsDialogOpen(false);
      } else {
        toast.error(data.error || "Erro ao atualizar valor de procedimento");
      }
    } catch (error) {
      toast.error("Erro ao atualizar valor de procedimento");
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
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-2 items-end">
            <FormField
              control={form.control}
              name="convenio_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Convênio *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      const convenio = convenios.find((item) => item.id == +value);
                      setConvenioSelecionado(convenio || null);
                      setProcedimentoSelecionado(null);
                      form.setValue("procedimento_id", 0);
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
                      {convenios.map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500 text-sm mt-1">
                    {form.formState.errors.convenio_id?.message}
                  </FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tipo_cliente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo Cliente *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setTipoClienteSelecionado(value);
                      setProcedimentoSelecionado(null);
                      form.setValue("procedimento_id", 0);
                    }}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SOCIO">SOCIO</SelectItem>
                      <SelectItem value="NSOCIO">NSOCIO</SelectItem>
                      <SelectItem value="PARCEIRO">PARCEIRO</SelectItem>
                      <SelectItem value="FUNCIONARIO">FUNCIONARIO</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500 text-sm mt-1">
                    {form.formState.errors.tipo_cliente?.message}
                  </FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tabela_faturamento_id"
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
                    value={field.value ? field.value.toString() :  ""}
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
                    {form.formState.errors.tabela_faturamento_id?.message}
                  </FormMessage>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="procedimento_id"
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
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500 text-sm mt-1">
                    {form.formState.errors.procedimento_id?.message}
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
      {}
      {carregando ? (
        <div className="flex justify-center items-center w-full h-40">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Carregando ...</span>
        </div>
      ) : !tabelaSelecionado || !convenioSelecionado ? (
        <div className="flex justify-center items-center w-full h-40">
          <span className="text-gray-500">
            Selecione um convênio e uma tabela de faturamento para ver os valores de procedimentos
          </span>
        </div>
      ) : (
        <>
          {valorProcedimentosSeguro.length === 0 ? (
            <div className="flex justify-center items-center w-full h-40">
                          <span className="ml-2 text-gray-500">
              {!tabelaSelecionado || !convenioSelecionado ? 
                'Selecione um convênio e uma tabela de faturamento para ver os valores de procedimentos' : 
                'Nenhum valor de procedimento encontrado'
              }
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
                {valorProcedimentosSeguro.map((valorProcedimento) => (
                  <TableRow
                    key={valorProcedimento.id}
                    className={"odd:bg-gray-100 even:bg-white"}
                  >
                    <TableCell>{valorProcedimento.id}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {valorProcedimento.procedimento?.nome || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatValor(valorProcedimento.valor)}</TableCell>
                    <TableCell>{valorProcedimento.tipo}</TableCell>
                    <TableCell className="flex gap-3 justify-center">
                      {}
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
                      {}
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
          {}
          <div className="flex justify-between items-center ml-1 mt-4">
            <div className="text-sm text-gray-600">
              Mostrando{" "}
              {Math.min((paginaAtual + 1) * 5, totalValorProcedimentos)} de{" "}
              {totalValorProcedimentos} valores de procedimentos
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <FormProvider {...formUpdate}>
          <DialogContent className="w-full max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Valor de Procedimento</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={formUpdate.handleSubmit(onSubmitUpdate)}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
                <FormField
                  control={formUpdate.control}
                  name="convenio_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Convênio *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          const convenio = convenios.find((item) => item.id == +value);
                          setConvenioSelecionado(convenio || null);
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
                          {convenios.map((item) => (
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
                          formUpdate.formState.errors.convenio_id
                            ?.message
                        }
                      </FormMessage>
                    </FormItem>
                  )}
                />
                <FormField
                  control={formUpdate.control}
                  name="tipo_cliente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo Cliente *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setTipoClienteSelecionado(value);
                        }}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SOCIO">SOCIO</SelectItem>
                          <SelectItem value="NSOCIO">NSOCIO</SelectItem>
                          <SelectItem value="PARCEIRO">PARCEIRO</SelectItem>
                          <SelectItem value="FUNCIONARIO">FUNCIONARIO</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-500 text-sm mt-1">
                        {
                          formUpdate.formState.errors.tipo_cliente
                            ?.message
                        }
                      </FormMessage>
                    </FormItem>
                  )}
                />
                <FormField
                  control={formUpdate.control}
                  name="tabela_faturamento_id"
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
                          formUpdate.formState.errors.tabela_faturamento_id
                            ?.message
                        }
                      </FormMessage>
                    </FormItem>
                  )}
                />
                <FormField
                  control={formUpdate.control}
                  name="procedimento_id"
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
                        {formUpdate.formState.errors.procedimento_id?.message}
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