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
import {
  deleteLancamento,
  updateStatusLancamento,
} from "@/app/api/lancamentos/action";
//Types
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
  const carregarLancamentos = async (filters?: any) => {
    setCarregando(true);
    try {
      const params: any = {
        page: paginaAtual + 1,
        limit: 5,
        search: termoBusca,
      };

      if (filters?.caixas_id && filters.caixas_id != 0) {
        params.caixas_id = filters.caixas_id;
      }

      if (filters?.plano_contas_id && filters.plano_contas_id != 0) {
        params.plano_contas_id = filters.plano_contas_id;
      }
      if (
        filters?.data_inicio &&
        filters.data_inicio.trim() !== "" &&
        filters?.data_fim &&
        filters.data_fim.trim() !== ""
      ) {
        params.data_inicio = filters.data_inicio;
        params.data_fim = filters.data_fim;
      }

      const { data } = await http.get("/lancamentos", {
        params,
      });

      setLancamentos(data.data);
      setTotalPaginas(data.totalPages);
      setTotalLancamentos(data.total);
    } catch (error) {
      console.error("Erro ao buscar lançamentos:", error);
    } finally {
      setCarregando(false);
    }
  };
  const form = useForm({
    mode: "onChange",
    defaultValues: {
      plano_contas_id: 0,
      caixas_id: 0,
      data_inicio: "",
      data_fim: "",
    },
  });
  const fetchCaixas = async () => {
    try {
      const { data } = await http.get("/caixas");

      setCaixas(data.data);
    } catch (error: any) {}
  };
  const fetchPlanoContas = async () => {
    try {
      const { data } = await http.get("/plano-contas");
      setPlanoConta(data.data);
    } catch (error: any) {}
  };

  const handleUpdateStatus = async () => {
    if (!lancamentoSelecionado) return;
    setLoadingAction(true);

    try {
      const novoStatus =
        lancamentoSelecionado.status === "ATIVO" ? "INATIVO" : "ATIVO";
      console.log(lancamentoSelecionado.id, novoStatus);
      await updateStatusLancamento(lancamentoSelecionado.id, novoStatus);

      toast.success(
        `Lançamento ${
          novoStatus === "ATIVO" ? "ativado" : "desativado"
        } com sucesso!`
      );

      await carregarLancamentos(form.getValues());
    } catch (error) {
      console.error("Erro ao alterar status do lançamento:", error);
      toast.error("Erro ao tentar alterar o status do lançamento.");
    } finally {
      setLoadingAction(false);
      setIsDialogOpen(false);
    }
  };

  const isAtivando = lancamentoSelecionado?.status === "INATIVO";

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

  const handleSearch = (values: any) => {
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
                  name="caixas_id"
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
                  name="plano_contas_id"
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
      {/* Loader - Oculta a Tabela enquanto carrega */}
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
                Nenhuma lançamento encontrado ...
              </span>
            </div>
          ) : (
            <Table className="mt-8">
              <TableHeader>
                <TableRow>
                  <TableHead className="h-12-1">ID</TableHead>
                  <TableHead className="h-12-1">Data Lançamento</TableHead>
                  <TableHead className="h-12-1">Caixa</TableHead>
                  <TableHead className="h-12-1">Entrada</TableHead>
                  <TableHead className="h-12-1">Saída</TableHead>
                  <TableHead className="h-12-1">Plano de Conta</TableHead>
                  <TableHead className="h-12-1">Pagante</TableHead>
                  <TableHead className="h-12-1">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-center">
                {lancamentos.map((lancamento) => (
                  <TableRow
                    key={lancamento.id}
                    className={"odd:bg-gray-100 even:bg-white"}
                  >
                    <TableCell>{lancamento.id}</TableCell>
                    <TableCell>
                      {formatDate(lancamento.data_lancamento, "dd/MM/yyyy")}
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline">
                        {lancamento.caixa ? lancamento.caixa.nome : "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {lancamento.tipo === "ENTRADA" && (
                        <Badge className="bg-green-500">
                          R${lancamento.valor}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {lancamento.tipo === "SAIDA" && (
                        <Badge className="bg-destructive">
                          R${lancamento.valor}
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge variant="default">
                        <div>
                          {lancamento.plano_conta
                            ? lancamento.plano_conta.nome
                            : "N/A"}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{lancamento.usuario.nome}</Badge>
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
                                lancamento.status === "ATIVO"
                                  ? "destructive"
                                  : "outline"
                              }
                              onClick={() => {
                                setLancamentoSelecionado(lancamento);
                                setIsDialogOpen(true);
                              }}
                            >
                              {lancamento.status === "ATIVO" ? (
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
                              {lancamento.status === "ATIVO"
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
          {/* Totalizador de Lancamentos */}
          <div className="flex justify-between items-center ml-1 mt-4">
            <div className="text-sm text-gray-600">
              Mostrando {Math.min((paginaAtual + 1) * 5, totalLancamentos)} de{" "}
              {totalLancamentos} lançamentos
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
