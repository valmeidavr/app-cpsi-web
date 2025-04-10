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
  Power,
  Plus,
  Trash2,
  PlusCircle,
  Calendar,
} from "lucide-react";
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
import { deleteLancamento } from "@/app/api/lancamentos/action";
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
  const [loadingInativar, setLoadingInativar] = useState(false);
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

      if (filters?.data_lancamento && filters.data_lancamento.trim() !== "") {
        params.data_lancamento = filters.data_lancamento;
      }

      const { data } = await http.get("http://localhost:3000/lancamentos", {
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
      data_lancamento: "",
    },
  });
  const fetchCaixas = async () => {
    try {
      const { data } = await http.get("http://localhost:3000/caixas");

      setCaixas(data.data);
    } catch (error: any) {}
  };
  const fetchPlanoContas = async () => {
    try {
      const { data } = await http.get("http://localhost:3000/plano-contas");
      setPlanoConta(data.data);
    } catch (error: any) {}
  };

  const HandlefinalizarTurma = async (values: any) => {
    if (!lancamentoSelecionado) return;
    setLoadingInativar(true);
    try {
      await deleteLancamento(lancamentoSelecionado.id);
      await carregarLancamentos();
      toast.error("Lançamento salvo com sucesso!");
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Erro ao alterar status do lançamento:", error);
    } finally {
      setLoadingInativar(false);
    }
  };

  useEffect(() => {
    fetchCaixas();
    fetchPlanoContas();
    carregarLancamentos();
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
        <form className="space-y-4" onSubmit={form.handleSubmit(handleSearch)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
            <FormField
              control={form.control}
              name="caixas_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Caixa *</FormLabel>
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
                      <SelectItem value="0">Selecione</SelectItem>
                      {caixas.map((caixa) => (
                        <SelectItem key={caixa.id} value={caixa.id.toString()}>
                          {caixa.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="plano_contas_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plano de Conta *</FormLabel>
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
                      <SelectItem value="0">Selecione</SelectItem>
                      {planoConta.map((planoConta) => (
                        <SelectItem
                          key={planoConta.id}
                          value={planoConta.id.toString()}
                        >
                          {planoConta.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 items-end">
            <FormField
              control={form.control}
              name="data_lancamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Início *</FormLabel>
                  <FormControl>
                    <div className=" field-wrapper flex align-center items-center gap-2 p-[8px] border-2 rounded-lg">
                      <Calendar className="w-4 h-4" />
                      <Input
                        type="date"
                        {...field}
                        className={`input-modified focus-visible:ring-0`}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="w-[120px]" variant="default" type="submit">
              <Search className="w-4 h-4" />
              Buscar
            </Button>
          </div>
        </form>
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
                  <TableHead className="h-12-1">Data</TableHead>
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
                      <Badge variant="outline">{lancamento.caixa.nome}</Badge>
                    </TableCell>
                    <TableCell>
                      {lancamento.tipo === "ENTRADA" && (
                        <Badge className="bg-green-500">
                          R${lancamento.valor}
                        </Badge>
                      )}
                    </TableCell>

                    {/* Coluna SAÍDA */}
                    <TableCell>
                      {lancamento.tipo === "SAIDA" && (
                        <Badge className="bg-destructive">
                          R${lancamento.valor}
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge variant="default">
                        <div>{lancamento.plano_conta.nome}</div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{lancamento.usuario.nome}</Badge>
                    </TableCell>
                    <TableCell className="flex gap-3 justify-center">
                      {/* ✅ Botão Editar com Tooltip */}

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
                      {/* ✅ Botão Editar com Tooltip */}

                      <Tooltip.Provider>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={() => {
                                setLancamentoSelecionado(lancamento);
                                setIsDialogOpen(true);
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
                              Deletar Lançamento
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
        <FormProvider {...form}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Ação</DialogTitle>
            </DialogHeader>
            <p className="text-gray-700">
              Você tem certeza que deseja finalizar o lançamento?
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
    </div>
  );
}
