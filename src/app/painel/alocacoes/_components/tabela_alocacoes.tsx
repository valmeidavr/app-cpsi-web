"use client";
import {
  deleteAlocacao,

} from "@/app/api/alocacoes/action";
import { updateAlocacaoSchema } from "@/app/api/alocacoes/shema/formSchemaAlocacao";
import { getEspecialidades } from "@/app/api/especialidades/action";
import { Alocacao } from "@/app/types/Alocacao";
import { Especialidade } from "@/app/types/Especialidade";
import { Prestador } from "@/app/types/Prestador";
import { Unidade } from "@/app/types/Unidades";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { zodResolver } from "@hookform/resolvers/zod";
import { DropdownMenuItem } from "@radix-ui/react-dropdown-menu";
import { Loader2, MenuIcon, Pencil, SaveIcon, Trash2 } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

interface TabelaAlocacoesProps {
  alocacoes: Alocacao[];
  CarregandoDadosAlocacao: boolean;
  fetchAlocacoes: () => {};
  setCarregandoDadosAlocacao: Dispatch<SetStateAction<boolean>>;
  prestador: Prestador | null;
  unidade: Unidade | null;
}

const TabelaAlocacoes = ({
  alocacoes,
  CarregandoDadosAlocacao,
  fetchAlocacoes,
  setCarregandoDadosAlocacao,
  prestador,
  unidade,
}: TabelaAlocacoesProps) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [alocacaoSelecionada, setAlocacaoSelecionada] =
    useState<Alocacao | null>(null);

  const [loading, setloading] = useState<boolean>(false);
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);

  const form = useForm({
    resolver:
      zodResolver<z.infer<typeof updateAlocacaoSchema>>(updateAlocacaoSchema),
    mode: "onChange",
    defaultValues: {
      prestadoresId: prestador?.id ?? 0,
      unidadesId: unidade?.id ?? 0,
      especialidadesId: undefined,
    },
  });

  const excluirAlocacao = async (alocacaoId: number) => {
    try {
      setloading(true);
      await deleteAlocacao(alocacaoId.toString());

      toast.error("Alocação excluida com sucesso");
      await fetchAlocacoes();
    } catch (error: any) {
      toast.error("Não foi posssivel deletar a alocação", error);
    } finally {
      setIsDeleteModalOpen(false);
      setloading(false);
    }
  };

  // const handleOpenUpdateModal = async (alocacaoParaAtualizar: Alocacao) => {
  //   try {
  //     setAlocacaoSelecionada(alocacaoParaAtualizar);
  //     const data = await getAlocacaoById(alocacaoParaAtualizar.id.toString());

  //     console.log("Dados recebidos da API:", data);
  //     form.reset({
  //       prestadoresId: data.prestadoresId,
  //       unidadesId: data.unidadesId,
  //       especialidadesId: data.especialidadesId,
  //     });
  //     setIsUpdateModalOpen(true);
  //   } catch (error) {
  //     toast.error("Falha ao carregar os dados da alocação para edição.");
  //     console.error(error);
  //   }
  // };

  // const onSubmit = async (values: z.infer<typeof updateAlocacaoSchema>) => {
  //   try {
  //     setCarregandoDadosAlocacao(true);
  //     if (!alocacaoSelecionada) return;
  //     await updateAlocacao(alocacaoSelecionada.id.toString(), values);
  //     await fetchAlocacoes();
  //     toast.success("Alocação criada com sucesso!");
  //   } catch (error) {
  //     toast.error("Não foi possivel criar a Alocação!");
  //   } finally {
  //     setCarregandoDadosAlocacao(false);
  //   }
  // };

  const fetchEspecialidades = async () => {
    try {
      const { data } = await getEspecialidades();
      setEspecialidades(data);
    } catch (error: any) {
      toast.error("Erro ao carregar dados dos Especialidades");
    }
  };

  useEffect(() => {
    fetchEspecialidades();
  }, []);
  return (
    <>
      <Table className="text-xs min-w-full">
        <TableHeader className="bg-gray-100 sticky top-0 z-10">
          <TableRow>
            <TableHead className="text-center">Especialidade</TableHead>
            <TableHead className="text-center">Opções</TableHead>
          </TableRow>
        </TableHeader>
        {CarregandoDadosAlocacao ? (
          <TableRow>
            <TableCell colSpan={5}>
              <div className="flex justify-center items-center h-20">
                <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                <span className="ml-2 text-gray-500">Carregando ...</span>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          <TableBody className="text-center uppercase">
            {alocacoes.length > 0 ? (
              alocacoes.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.especialidade.nome}</TableCell>

                  <TableCell className="flex justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MenuIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="p-2">
                        {/* <DropdownMenuItem
                          className="flex items-center gap-2 cursor-pointer"
                          onSelect={() => handleOpenUpdateModal(row)}
                        >
                          <Pencil className="w-4 h-4" />
                          <span>Editar</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator /> */}
                        <DropdownMenuItem
                          className="flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                          onSelect={() => {
                            setAlocacaoSelecionada(row);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Excluir</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5}>
                  <div className="flex justify-center items-center h-20">
                    <span className="ml-2 text-gray-500">
                      Nenhuma Alocação encontrada ...
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        )}
      </Table>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Alocação </DialogTitle>
          </DialogHeader>
          Tem certeza que deseja excluir a alocação do dia{" "}
          <DialogFooter>
            <Button variant="secondary" disabled={loading}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              type="submit"
              onClick={() => excluirAlocacao(alocacaoSelecionada!.id)}
              disabled={loading}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
{/* 
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Alocação</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="especialidadesId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especialidade *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={field.value ? String(field.value) : ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma especialidade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {especialidades.map((item) => (
                          <SelectItem key={item.id} value={String(item.id)}>
                            {item.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsUpdateModalOpen(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button variant="default" type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog> */}
    </>
  );
};

export default TabelaAlocacoes;
