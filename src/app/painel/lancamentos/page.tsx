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
import {
  Loader2,
  Search,
  Edit,
  Trash2,
  PlusCircle,
  Calendar,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "date-fns";
import { formatValor } from "@/app/helpers/format";
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
import { cn } from "@/lib/utils";
import { Lancamento } from "@/app/types/Lancamento";
import { Caixa } from "@/app/types/Caixa";
import { PlanoConta } from "@/app/types/PlanoConta";
export default function Lancamentos() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalLancamentos, setTotalLancamentos] = useState(0);
  const [termoBusca, setTermoBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [lancamentoSelecionado, setLancamentoSelecionado] =
    useState<Lancamento | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [planoConta, setPlanoConta] = useState<PlanoConta[]>([]);
  const carregarLancamentos = async (filters?: {
    caixa_id?: number;
    plano_conta_id?: number;
    data_inicio?: string;
    data_fim?: string;
  }) => {
    setCarregando(true);
    try {
      const params = new URLSearchParams();
      params.append('page', (paginaAtual + 1).toString());
      params.append('limit', '10');
      params.append('search', termoBusca);
      if (filters?.caixa_id && filters.caixa_id != 0) {
        params.append('caixa_id', filters.caixa_id.toString());
      }
      if (filters?.plano_conta_id && filters.plano_conta_id != 0) {
        params.append('plano_conta_id', filters.plano_conta_id.toString());
      }
      if (
        filters?.data_inicio &&
        filters.data_inicio.trim() !== "" &&
        filters?.data_fim &&
        filters.data_fim.trim() !== ""
      ) {
        params.append('data_inicio', filters.data_inicio);
        params.append('data_fim', filters.data_fim);
      }
      console.log('🔍 [FRONTEND] Carregando lançamentos com URL:', `/api/lancamentos?${params}`);
      const response = await fetch(`/api/lancamentos?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('📊 [FRONTEND] Lançamentos carregados:', data.data.length, 'itens');
        console.log('📊 [FRONTEND] Primeiro lançamento status:', data.data[0]?.status);
        setLancamentos(data.data);
        setTotalPaginas(data.pagination.totalPages);
        setTotalLancamentos(data.pagination.total);
      } else {
      }
    } catch (error) {
    } finally {
      setCarregando(false);
    }
  };
  const form = useForm({
    mode: "onChange",
    defaultValues: {
      plano_conta_id: 0,
      caixa_id: 0,
      data_inicio: "",
      data_fim: "",
    },
  });
  const fetchCaixas = async () => {
    try {
      const response = await fetch("/api/caixa");
      const data = await response.json();
      if (response.ok) {
        setCaixas(data.data);
      } else {
      }
    } catch (error) {
    }
  };
  const fetchPlanoContas = async () => {
    try {
      const response = await fetch("/api/plano_contas");
      const data = await response.json();
      if (response.ok) {
        setPlanoConta(data.data);
      } else {
      }
    } catch (error) {
    }
  };
  const handleUpdateStatus = async () => {
    if (!lancamentoSelecionado) return;
    setLoadingAction(true);
    try {
      const novoStatus =
        lancamentoSelecionado.status === "Ativo" ? "Inativo" : "Ativo";
        
      console.log('🔄 [FRONTEND] Alterando status do lançamento:', lancamentoSelecionado.id);
      console.log('🔄 [FRONTEND] Status atual:', lancamentoSelecionado.status);
      console.log('🔄 [FRONTEND] Novo status:', novoStatus);
      
      const response = await fetch(`/api/lancamentos/${lancamentoSelecionado.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: novoStatus }),
      });
      
      const responseData = await response.json();
      console.log('📊 [FRONTEND] Resposta da API:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Erro ao atualizar status');
      }
      
      toast.success(
        `Lançamento ${
          novoStatus === "Ativo" ? "ativado" : "desativado"
        } com sucesso!`
      );
      
      // Aguardar um pouco antes de recarregar para garantir que a transação foi commitada
      await new Promise(resolve => setTimeout(resolve, 500));
      await carregarLancamentos(form.getValues());
      
    } catch (error) {
      console.error('❌ [FRONTEND] Erro ao alterar status:', error);
      toast.error("Erro ao tentar alterar o status do lançamento.");
    } finally {
      setLoadingAction(false);
      setIsDialogOpen(false);
    }
  };
  const isAtivando = lancamentoSelecionado?.status === "Inativo";
  useEffect(() => {
    fetchCaixas();
    fetchPlanoContas();
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
  const handleSearch = (values: {
    caixa_id: number;
    plano_conta_id: number;
    data_inicio: string;
    data_fim: string;
  }) => {
    if (!values.data_inicio && !values.data_fim) {
      toast.error("Selecione pelo menos uma data (início ou fim) para buscar os lançamentos");
      return;
    }
    setPaginaAtual(0);
    carregarLancamentos(values);
  };
  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Lista de Lançamentos" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-4 mt-5">Lista de Lançamentos</h1>
      <Form {...form}>
        <div className="border bg-card text-card-foreground p-6 rounded-lg shadow-sm mb-8">
          <form onSubmit={form.handleSubmit(handleSearch)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 items-end gap-6">
              <div className="lg:col-span-1">
                <FormField
                  control={form.control}
                  name="caixa_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Caixa</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Todos</SelectItem>
                          {caixas.map((caixa) => (
                            <SelectItem
                              key={caixa.id}
                              value={caixa.id.toString()}
                            >
                              {caixa.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <div className="lg:col-span-1">
                <FormField
                  control={form.control}
                  name="plano_conta_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plano de Conta</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Todos</SelectItem>
                          {planoConta.map((plano) => (
                            <SelectItem
                              key={plano.id}
                              value={plano.id.toString()}
                            >
                              {plano.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <div className="lg:col-span-1">
                <FormField
                  control={form.control}
                  name="data_inicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Início</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="lg:col-span-1">
                <FormField
                  control={form.control}
                  name="data_fim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Fim</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex items-center gap-2 lg:col-span-1">
                <Button className="w-full" variant="default" type="submit">
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </Button>
              </div>
            </div>
          </form>
        </div>
      </Form>
      <div className="flex justify-start  gap-3 items-center mt-7 mb-3">
        <Badge className="bg-green-500 px-3 py-2">
          <Link
            href="/painel/lancamentos/novo?tipo=ENTRADA"
            className="flex items-center font-semibold "
          >
            <PlusCircle className="w-5h-5 mr-2" />
            Entrada
          </Link>
        </Badge>
        <Badge className="bg-destructive px-3 py-2">
          <Link
            href="/painel/lancamentos/novo?tipo=SAIDA"
            className="flex items-center font-semibold "
          >
            <PlusCircle className="w-5h-5 mr-2" />
            Saída
          </Link>
        </Badge>
        <Badge className="bg-orange-400 px-3 py-2">
          <Link
            href="/painel/lancamentos/novo?tipo=TRANSFERENCIA"
            className="flex items-center font-semibold "
          >
            <PlusCircle className="w-5h-5 mr-2" />
            Transferência
          </Link>
        </Badge>
      </div>
      {}
      {carregando ? (
        <div className="flex justify-center items-center w-full h-40">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Carregando ...</span>
        </div>
      ) : (
        <>
          {lancamentos.length === 0 ? (
            <div className="flex justify-center items-center w-full h-40">
              <span className="ml-2 text-gray-500">
                {!form.watch('data_inicio') && !form.watch('data_fim') 
                  ? "Selecione uma data início e fim para buscar os lançamentos"
                  : "Nenhum lançamento encontrado para os filtros selecionados"
                }
              </span>
            </div>
          ) : (
            <Table className="mt-8">
              <TableHeader>
                <TableRow>
                  <TableHead className="h-12-1">ID</TableHead>
                  <TableHead className="h-12-1">Data Lançamento</TableHead>
                  <TableHead className="h-12-1">Caixa</TableHead>
                  <TableHead className="h-12-1">Tipo</TableHead>
                  <TableHead className="h-12-1">Valor</TableHead>
                  <TableHead className="h-12-1">Plano de Conta</TableHead>
                  <TableHead className="h-12-1">Pagante</TableHead>
                  <TableHead className="h-12-1">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-center">
                {lancamentos.map((lancamento) => (
                  <TableRow
                    key={lancamento.id}
                    className={cn(
                      "odd:bg-gray-100 even:bg-white",
                      lancamento.status === "Inativo" && "bg-gray-50 text-gray-500 opacity-75"
                    )}
                  >
                    <TableCell>{lancamento.id}</TableCell>
                    <TableCell>
                      {formatDate(lancamento.data_lancamento, "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={cn(
                          lancamento.status === "Inativo" && "bg-gray-100 text-gray-400 border-gray-200"
                        )}
                      >
                        {lancamento.caixa_nome || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={cn(
                          lancamento.tipo === "ENTRADA" ? "bg-green-500" : 
                          lancamento.tipo === "SAIDA" ? "bg-destructive" :
                          "bg-orange-400",
                          lancamento.status === "Inativo" && "bg-gray-100 text-gray-400 border-gray-200"
                        )}
                      >
                        {lancamento.tipo === "ENTRADA" ? "Entrada" : 
                         lancamento.tipo === "SAIDA" ? "Saída" : 
                         "Transferência"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={cn(
                          lancamento.status === "Inativo" && "bg-gray-100 text-gray-400 border-gray-200"
                        )}
                      >
                        {formatValor(lancamento.valor)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="default"
                        className={cn(
                          lancamento.status === "Inativo" && "bg-gray-100 text-gray-400 border-gray-200"
                        )}
                      >
                        <div>
                          {lancamento.plano_conta_nome || "N/A"}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={cn(
                          lancamento.status === "Inativo" && "bg-gray-100 text-gray-400 border-gray-200"
                        )}
                      >{lancamento.cliente_nome || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell className="flex gap-3 justify-center">
                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <Link
                              href={`/painel/lancamentos/editar/${lancamento.id}`}
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
                              Editar Lançamento
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </Tooltip.Provider>
                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <Button
                              size="icon"
                              variant={
                                lancamento.status === "Ativo"
                                  ? "destructive"
                                  : "outline"
                              }
                              onClick={() => {
                                setLancamentoSelecionado(lancamento);
                                setIsDialogOpen(true);
                              }}
                            >
                              {lancamento.status === "Ativo" ? (
                                <ToggleLeft className="h-5 w-5 " />
                              ) : (
                                <ToggleRight className="h-5 w-5 text-green-500" />
                              )}
                            </Button>
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content
                              side="top"
                              className="bg-gray-700 text-white text-xs px-2 py-1 rounded-md shadow-md"
                            >
                              {lancamento.status === "Ativo"
                                ? "Desativar Lançamento"
                                : "Ativar Lançamento"}
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
              Mostrando {Math.min((paginaAtual + 1) * 5, totalLancamentos)} de{" "}
              {totalLancamentos} lançamentos
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Confirmar {isAtivando ? "Ativação" : "Desativação"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-gray-700">
            Você tem certeza que deseja{" "}
            <b>{isAtivando ? "ativar" : "desativar"}</b> o lançamento de ID{" "}
            <b>{lancamentoSelecionado?.id}</b>?
          </p>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setIsDialogOpen(false)}
              disabled={loadingAction}
            >
              Cancelar
            </Button>
            <Button
              type="button" // Mudado para type="button" para não submeter forms
              variant={isAtivando ? "default" : "destructive"}
              onClick={handleUpdateStatus} // Chama a nova função
              disabled={loadingAction}
            >
              {loadingAction ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>Confirmar {isAtivando ? "Ativação" : "Desativação"}</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}