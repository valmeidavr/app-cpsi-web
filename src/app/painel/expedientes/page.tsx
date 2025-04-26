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

//Helpers
import { http } from "@/util/http";
import { format, formatDate, parseISO } from "date-fns";

//Types
import { Expediente } from "@/app/types/Expediente";

export default function Expedientes() {
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalExpedientes, setTotalExpedientes] = useState(0);
  const [termoBusca, setTermoBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [expedienteSelecionado, setExpedienteSelecionado] =
    useState<Expediente | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loadingInativar, setLoadingInativar] = useState(false);
  const router = useRouter();
  const carregarExpedientes = async () => {
    setCarregando(true);
    try {
      const { data } = await http.get("http://localhost:3000/expedientes", {
        params: {
          page: paginaAtual + 1,
          limit: 5,
          search: termoBusca,
        },
      });
      console.log(data.data);
      setExpedientes(data.data);
      setTotalPaginas(data.totalPages);
      setTotalExpedientes(data.total);
    } catch (error) {
      console.error("Erro ao buscar expedientes:", error);
    } finally {
      setCarregando(false);
    }
  };

  // const form = useForm({
  //   resolver: zodResolver(z.object({ dataFim: z.string().optional() })),
  //   mode: "onChange",
  //   defaultValues: {
  //     dataFim: "",
  //   },
  // });

  useEffect(() => {
    carregarExpedientes();
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
    carregarExpedientes();
  };

  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Lista de Expedientes" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-4 mt-5">Lista de Expedientes</h1>

      {/* Barra de Pesquisa e Botão Novo Expediente */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Pesquisar expediente"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-96 max-w-lg"
          />
          <Button variant="secondary" onClick={handleSearch}>
            <Search className="w-4 h-4" />
            Buscar
          </Button>
        </div>

        {/* ✅ Botão Novo Expediente */}
        <Button asChild>
          <Link href="/painel/expedientes/novo">
            <Plus className="h-5 w-5 mr-2" />
            Novo Expediente
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
          {/* Tabela de Expedientes */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-12-1">ID</TableHead>
                <TableHead className="h-12-1">Horário Inicial</TableHead>
                <TableHead className="h-12-1">Horário Final</TableHead>
                <TableHead className="h-12-1">Dias da semana</TableHead>
                <TableHead className="h-12-1">Data Inicio</TableHead>
                <TableHead className="h-12-1">Data Fim</TableHead>
                <TableHead className="h-12-1">Alocação</TableHead>
                <TableHead className="h-12-1">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-center">
              {expedientes.map((expediente) => (
                <TableRow
                  key={expediente.id}
                  className={"odd:bg-gray-100 even:bg-white"}
                >
                  <TableCell>{expediente.id}</TableCell>
                  <TableCell>
                    <Badge>
                      {expediente.hinicio}
                    </Badge>
                    
                  </TableCell>
                  <TableCell><Badge>
                      {expediente.hfinal}
                    </Badge></TableCell>
                  <TableCell>
                  <Badge className="text-[13px]" variant="outline">
                    {expediente.semana}
                  </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge>
                      {format(parseISO(expediente.dtinicio), "dd/MM/yyyy")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge>
                    {format(parseISO(expediente.dtfinal), "dd/MM/yyyy")}
                    </Badge>
                  </TableCell>
                  <TableCell>{expediente.alocacaoId}</TableCell>
                  <TableCell className="flex gap-3 justify-center">
                    {/* ✅ Botão Editar com Tooltip */}

                    <Tooltip.Provider>
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <Link
                            href={`/painel/expedientes/editar/${expediente.id}`}
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
                            Editar Expediente
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {/* Totalizador de Expedientes */}
          <div className="flex justify-between items-center ml-1 mt-4">
            <div className="text-sm text-gray-600">
              Mostrando {Math.min((paginaAtual + 1) * 5, totalExpedientes)} de{" "}
              {totalExpedientes} expedientes
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

      {/* ✅ Diálogo de Confirmação
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <FormProvider {...form}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Ação</DialogTitle>
            </DialogHeader>
            <form>
              <FormField
                control={form.control}
                name="dataFim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Fim</FormLabel>
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
      </Dialog> */}
    </div>
  );
}
