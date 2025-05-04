"use client";
import { deleteAlocacao, updateAlocacao } from "@/app/api/alocacoes/action";
import { updateAlocacaoSchema } from "@/app/api/alocacoes/shema/formSchemaAlocacao";
import { getEspecialidades } from "@/app/api/especialidades/action";
import { getPrestadors } from "@/app/api/prestadores/action";
import { getUnidades } from "@/app/api/unidades/action";
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
import { SelectItem } from "@radix-ui/react-select";
import { Loader2, MenuIcon, SaveIcon } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
    resolver: zodResolver(updateAlocacaoSchema),
    mode: "onChange",
    defaultValues: {
      prestadoresId: prestador ? prestador.id : 0,
      unidadesId: unidade ? unidade.id : 0,
      especialidadesId: 0,
    },
  });

  const excluirAlocacao = async (alocacaoId: number) => {
    try {
      setloading(true);
      await deleteAlocacao(alocacaoId.toString());
      console.log("values:", alocacaoId);
      toast.error("Alocação excluida com sucesso");
      await fetchAlocacoes();
    } catch (error: any) {
      toast.error("Não foi posssivel deletar a alocação", error);
    } finally {
      setIsDeleteModalOpen(false);
      setloading(false);
    }
  };

  useEffect(() => {
    if (alocacaoSelecionada) {
      form.reset({
        especialidadesId: +alocacaoSelecionada.especialidadesId,
      });
    }
  }, [alocacaoSelecionada]);

  const onSubmit = async (values: z.infer<typeof updateAlocacaoSchema>) => {
    try {
      setCarregandoDadosAlocacao(true);
      if (!alocacaoSelecionada) return;
      await updateAlocacao(alocacaoSelecionada.id.toString(), values);
      await fetchAlocacoes();
      toast.success("Alocação criada com sucesso!");
    } catch (error) {
      toast.error("Não foi possivel criar a Alocação!");
    } finally {
      setCarregandoDadosAlocacao(false);
    }
  };

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
                        <MenuIcon />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="p-2">
                        <>
                          <DropdownMenuItem
                            onSelect={() => {
                              setAlocacaoSelecionada(row),
                                setIsDeleteModalOpen(true);
                            }}
                          >
                            Excluir alocação
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => {
                              setAlocacaoSelecionada(row),
                                setIsUpdateModalOpen(true);
                            }}
                          >
                            Editar alocação
                          </DropdownMenuItem>
                        </>
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

      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Alocação </DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="especialidadesId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especialidade *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(Number(value));
                    }}
                    value={String(field.value)}
                  >
                    <FormControl
                      className={
                        form.formState.errors.especialidadesId
                          ? "border-red-500"
                          : "border-gray-300"
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0" disabled>
                        Selecione
                      </SelectItem>
                      {especialidades.map((especialidade) => {
                        return (
                          <SelectItem
                            key={especialidade.id}
                            value={String(especialidade.id)}
                          >
                            {especialidade.nome}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage>
                    {form.formState.errors.especialidadesId?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="secondary">Cancelar</Button>
              <Button variant="default" type="submit">
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TabelaAlocacoes;
