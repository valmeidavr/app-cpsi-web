"use client";

//React
import { useEffect, useState } from "react";
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

//Zod
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

//Helpers
import { http } from "@/util/http";
import { toast } from "sonner";
import { createUnidade } from "@/app/api/unidades/action";
import { formSchema } from "@/app/api/unidades/schema/formSchemaUnidades";
import { useRouter } from "next/navigation";

interface Unidade {
  id: number;
  nome: string;
}

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
      const { data } = await http.get("/unidades", {
        params: {
          page: paginaAtual + 1,
          limit: 5,
          search: termoBusca,
        },
      });

      setUnidades(data.data);
      setTotalPaginas(data.totalPages);
      setTotalUnidades(data.total);
    } catch (error) {
      console.error("Erro ao buscar unidades:", error);
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
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      nome: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      await createUnidade(values);
      carregarUnidades();
      toast.success("Unidade criada com sucesso!");
      form.reset();
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Erro ao salvar unidade!";

      // Exibindo toast de erro
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

      {/* Formulário condicional */}
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

      {/* Barra de Pesquisa e Botão Nova Unidade */}
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

      {/* Loader - Oculta a Tabela enquanto carrega */}
      {carregando ? (
        <div className="flex justify-center items-center w-full h-40">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Carregando ...</span>
        </div>
      ) : (
        <>
          {/* Tabela de Unidades */}
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
                  className={"odd:bg-gray-100 even:bg-white"}
                >
                  <TableCell>{unidade.id}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{unidade.nome}</Badge>
                  </TableCell>
                  <TableCell className="flex gap-3 justify-center">
                    {/* ✅ Botão Editar com Tooltip */}

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
          {/* Totalizador de Unidades */}
          <div className="flex justify-between items-center ml-1 mt-4">
            <div className="text-sm text-gray-600">
              Mostrando {Math.min((paginaAtual + 1) * 5, totalUnidades)} de{" "}
              {totalUnidades} unidades
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
    </div>
  );
}
