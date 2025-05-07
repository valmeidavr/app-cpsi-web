"use client";
import { getEspecialidades } from "@/app/api/especialidades/action";
import { getPrestadors } from "@/app/api/prestadores/action";
import { getUnidades } from "@/app/api/unidades/action";
import { Expediente } from "@/app/types/Expediente";
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
import { SelectItem } from "@radix-ui/react-select";
import { Loader2, MenuIcon, SaveIcon } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { updateExpedienteSchema } from "@/app/api/expediente/schema/formSchemaExpedientes";
import {
  finalizarExpediente,
  updateExpediente,
} from "@/app/api/expediente/action";
import { formatDate } from "date-fns";
import { Input } from "@/components/ui/input";

interface TabelaExpedienteProps {
  expedientes: Expediente[];
  CarregandoDadosExpediente: boolean;
  fetchExpedientes: () => {};
  setCarregandoDadosExpediente: Dispatch<SetStateAction<boolean>>;
  prestador: Prestador | null;
  unidade: Unidade | null;
}

const TabelaExpediente = ({
  expedientes,
  CarregandoDadosExpediente,
  fetchExpedientes,
  setCarregandoDadosExpediente,
}: TabelaExpedienteProps) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [ExpedienteSelecionada, setExpedienteSelecionada] =
    useState<Expediente | null>(null);

  const [loading, setloading] = useState<boolean>(false);
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);

  //Validação dos campos do formulário
  const form = useForm({
    resolver: zodResolver(updateExpedienteSchema),
    mode: "onChange",
    defaultValues: {
      dtinicio: "",
      dtfinal: "",
      hinicio: "",
      hfinal: "",
      semana: "",
      alocacaoId: 0,
    },
  });

  const excluirExpediente = async (ExpedienteId: number) => {
    try {
      setloading(true);
      await finalizarExpediente(ExpedienteId.toString());
      console.log("values:", ExpedienteId);
      toast.error("Alocação excluida com sucesso");
      await fetchExpedientes();
    } catch (error: any) {
      toast.error("Não foi posssivel deletar a alocação", error);
    } finally {
      setIsDeleteModalOpen(false);
      setloading(false);
    }
  };

  // useEffect(() => {
  //   if (ExpedienteSelecionada) {
  //     form.reset({
  //       especialidadesId: +ExpedienteSelecionada.especialidadesId,
  //     });
  //   }
  // }, [ExpedienteSelecionada]);

  const onSubmit = async (values: z.infer<typeof updateExpedienteSchema>) => {
    try {
      setCarregandoDadosExpediente(true);
      if (!ExpedienteSelecionada) return;
      await updateExpediente(ExpedienteSelecionada.id.toString(), values);
      await fetchExpedientes();
      toast.success("Expediente criada com sucesso!");
    } catch (error) {
      toast.error("Não foi possivel criar a Expediente!");
    } finally {
      setCarregandoDadosExpediente(false);
    }
  };

  return (
    <>
      <Table className="text-xs min-w-full">
        <TableHeader className="bg-gray-100 sticky top-0 z-10">
          <TableRow>
            <TableHead className="text-center">Semana</TableHead>
            <TableHead className="text-center">Min</TableHead>
            <TableHead className="text-center">Datas</TableHead>
            <TableHead className="text-center">Horário</TableHead>
            <TableHead className="text-center">Opções</TableHead>
          </TableRow>
        </TableHeader>
        {CarregandoDadosExpediente ? (
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
            {expedientes.length > 0 ? (
              expedientes.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.semana}</TableCell>
                  <TableCell>{row.intervalo}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <p>{formatDate(row.dtinicio, "dd/MM/yyyy")} </p>
                      <p> {formatDate(row.dtfinal, "dd/MM/yyyy")}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {row.hinicio} {row.hfinal}
                  </TableCell>

                  <TableCell className="flex justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <MenuIcon />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="p-2">
                        <>
                          <DropdownMenuItem
                            onSelect={() => {
                              setExpedienteSelecionada(row),
                                setIsDeleteModalOpen(true);
                            }}
                          >
                            Excluir alocação
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => {
                              setExpedienteSelecionada(row),
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
              onClick={() => excluirExpediente(ExpedienteSelecionada!.id)}
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
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex-1 overflow-y-auto space-y-4 p-2 justify-start"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="hinicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário Início *</FormLabel>
                      <FormControl>
                        <Input {...field} type="time" placeholder="08:00" />
                      </FormControl>
                      <FormMessage>
                        {form.formState.errors.hinicio?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hfinal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário Fim </FormLabel>
                      <FormControl>
                        <Input {...field} type="time" placeholder="08:00" />
                      </FormControl>
                      <FormMessage>
                        {form.formState.errors.hfinal?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="dtinicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início *</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage>
                        {form.formState.errors.dtinicio?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dtfinal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Fim *</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage>
                        {form.formState.errors.dtfinal?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="intervalo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Intervalo em minuntos*</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          maxLength={2}
                          placeholder="00"
                        />
                      </FormControl>
                      <FormMessage>
                        {form.formState.errors.intervalo?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="semana"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dias da semana</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0" disabled>
                          Selecione
                        </SelectItem>
                        <SelectItem value={"Segunda"}>Segunda</SelectItem>
                        <SelectItem value={"Terça"}>Terça</SelectItem>
                        <SelectItem value={"Quarta"}>Quarta</SelectItem>
                        <SelectItem value={"Quinta"}>Quinta</SelectItem>
                        <SelectItem value={"Sexta"}>Sexta</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage>
                      {form.formState.errors.semana?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Button type="submit" variant="default">
                      <SaveIcon /> Adicionar
                    </Button>
                  </>
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TabelaExpediente;
