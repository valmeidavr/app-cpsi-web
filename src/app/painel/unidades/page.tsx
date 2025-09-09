"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Loader2, Search, Edit, Power, Plus, X } from "lucide-react";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Save } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createUnidadeSchema } from "@/app/api/unidades/schema/formSchemaUnidades";
import { http } from "@/util/http";
import { Unidade } from "@/app/types/Unidades";
export default function Unidades() {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalUnidades, setTotalUnidades] = useState(0);
  const [termoBusca, setTermoBusca] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const carregarUnidades = async () => {
    setCarregando(true);
    try {
      const params = new URLSearchParams({
        page: (paginaAtual + 1).toString(),
        limit: '5',
        search: termoBusca,
      });
      const response = await fetch(`/api/unidades?${params}`);
      const data = await response.json();
      if (response.ok) {
        setUnidades(data.data);
        setTotalPaginas(data.pagination.totalPages);
        setTotalUnidades(data.pagination.total);
      } else {
      }
    } catch (error) {
    } finally {
      setCarregando(false);
    }
  };
  const handleSearch = () => {
    setPaginaAtual(0);
    carregarUnidades();
  };
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(createUnidadeSchema),
    mode: "onChange",
    defaultValues: {
      nome: "",
    },
  });
  const onSubmit = async (values: z.infer<typeof createUnidadeSchema>) => {
    setLoading(true);
    try {
      await http.post("/api/unidades", values);
      carregarUnidades();
      toast.success("Unidade criada com sucesso!");
      form.reset();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao salvar unidade!";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
    setLoading(false);
  };
  const toggleForm = () => {
    setIsFormVisible(!isFormVisible);
  };
  useEffect(() => {
    carregarUnidades();
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
  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Lista de Unidades" },
        ]}
      />
      {}
      {isFormVisible && (
        <div className="space-y-4 animate-fade-in mb-8">
          <div className="border-b">
            <h1 className="text-2xl font-bold mb-4 mt-5">Nova Unidade</h1>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 items-end">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Digite o nome da unidade"
                            {...field}
                            className={`border ${
                              form.formState.errors.nome
                                ? "border-red-500"
                                : "border-gray-300"
                            } focus:ring-2 focus:ring-primary`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 max-w-[200px]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Adicionar
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      )}
      <h1 className="text-2xl font-bold mb-4 mt-5">Lista de Unidades</h1>
      {}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Pesquisar unidades"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            className="w-96 max-w-lg"
          />
          <Button variant="secondary" onClick={handleSearch}>
            <Search className="w-4 h-4" />
            Buscar
          </Button>
        </div>
        <div className="flex justify-start w-fit">
          <Button onClick={toggleForm} className="flex items-center gap-2">
            {isFormVisible ? (
              <>
                <X className="w-4 h-4" />
                Cancelar
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Nova Unidade
              </>
            )}
          </Button>
        </div>
      </div>
      {}
      {carregando ? (
        <div className="flex justify-center items-center w-full h-40">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Carregando ...</span>
        </div>
      ) : (
        <>
          {}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-12-1">ID</TableHead>
                <TableHead className="h-12-1">Nome</TableHead>
                <TableHead className="h-12-1">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-center">
              {unidades.map((unidade) => (
                <TableRow
                  key={unidade.id}
                  className={cn(
                    "odd:bg-gray-100 even:bg-white",
                    (unidade as any).status === "Inativo" && "bg-gray-50 text-gray-500 opacity-75"
                  )}
                >
                  <TableCell>{unidade.id}</TableCell>
                  <TableCell>
                    <Badge 
                      className={cn(
                        "text-[13px]",
                        (unidade as any).status === "Inativo" && "bg-gray-100 text-gray-400 border-gray-200"
                      )} 
                      variant="outline"
                    >
                      {unidade.nome}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex gap-3 justify-center">
                    {}
                    <Tooltip.Provider>
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <Link href={`/painel/unidades/editar/${unidade.id}`}>
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
                            Editar Unidade
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {}
          <div className="flex justify-between items-center ml-1 mt-4">
            <div className="text-sm text-gray-600">
              Mostrando {Math.min((paginaAtual + 1) * 5, totalUnidades)} de{" "}
              {totalUnidades} unidades
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
    </div>
  );
}