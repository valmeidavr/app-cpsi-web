"use client";

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
  SelectItem,
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
import { updateExpedienteSchema } from "@/app/api/expediente/schema/formSchemaExpedientes";
import {
  finalizarExpediente,
  updateExpediente,
} from "@/app/api/expediente/action";
import { formatDate } from "date-fns";
import { Input } from "@/components/ui/input";
import { http } from "@/util/http";
import { Agenda } from "@/app/types/Agenda";
import { formatDateAsUTC } from "@/app/helpers/format";

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
  const [expedienteSelecionado, setExpedienteSelecionado] =
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
      intervalo: "",
      alocacaoId: 0,
    },
  });

  const excluirExpediente = async (ExpedienteId: number) => {
    try {
      setloading(true);

      const agendamentoExist: Agenda[] = await http.get(
        `/agendas/expediente?expedienteId=${ExpedienteId}`
      );
      if (agendamentoExist) {
        const agendamentoFeito = agendamentoExist.filter((agendamento) => {
          agendamento.situacao == "AGENDADO" ||
            agendamento.situacao == "CONFIRMADO";
        });
        if (agendamentoFeito)
          throw new Error("Existe agendamentos feitos neste expediente");
      }

      await finalizarExpediente(ExpedienteId.toString());

      toast.error("Alocação excluida com sucesso");
      await fetchExpedientes();
    } catch (error: any) {
      toast.error("Não foi posssivel deletar o expediente: ", error);
    } finally {
      setIsDeleteModalOpen(false);
      setloading(false);
    }
  };

  const handleOpenUpdateModal = (expediente: Expediente) => {
    setExpedienteSelecionado(expediente);
    const dtinicioFormatada = formatDate(expediente.dtinicio, "yyyy-MM-dd");
    const dtfinalFormatada = formatDate(expediente.dtfinal, "yyyy-MM-dd");

    form.reset({
      dtinicio: dtinicioFormatada,
      dtfinal: dtfinalFormatada,
      hinicio: expediente.hinicio,
      hfinal: expediente.hfinal,
      semana: expediente.semana.toUpperCase(),
      intervalo: String(expediente.intervalo.split(" ")[0]),
      alocacaoId: expediente.alocacaoId,
    });
    setIsUpdateModalOpen(true);
  };

  const onSubmit = async (values: z.infer<typeof updateExpedienteSchema>) => {
    if (!expedienteSelecionado) return;

    try {
      setloading(true);
      await updateExpediente(expedienteSelecionado.id.toString(), values);
      await fetchExpedientes();
      toast.success("Expediente atualizado com sucesso!");
      setIsUpdateModalOpen(false);
    } catch (error) {
      toast.error("Não foi possível atualizar o Expediente!");
    } finally {
      setloading(false);
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
                      <p>{formatDateAsUTC(row.dtinicio)} </p>
                      <p> {formatDateAsUTC(row.dtfinal)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {row.hinicio} {row.hfinal}
                  </TableCell>

                  <TableCell className="flex justify-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MenuIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="p-2">
                        {/* AJUSTE: Usando a nova função handleOpenUpdateModal */}
                        <DropdownMenuItem
                          className="flex items-center gap-2 cursor-pointer"
                          onSelect={() => handleOpenUpdateModal(row)}
                        >
                          <Pencil className="w-4 h-4" />
                          <span>Editar</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                          onSelect={() => {
                            setExpedienteSelecionado(row);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Finalizar</span>
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

      {/* MODAL DE DELEÇÃO (AJUSTADO) */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Expediente</DialogTitle>
          </DialogHeader>
          <div>
            Tem certeza que deseja finalizar este expediente? Esta ação não
            poderá ser desfeita.
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => excluirExpediente(expedienteSelecionado!.id)}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Finalizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* MODAL DE ATUALIZAÇÃO (CORRIGIDO) */}
      <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Atualizar Expediente</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 pt-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hinicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário Início *</FormLabel>
                      <FormControl>
                        <Input {...field} type="time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hfinal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário Fim *</FormLabel>
                      <FormControl>
                        <Input {...field} type="time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dtinicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início *</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="intervalo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Intervalo (minutos)*</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Ex: 15"
                          value={field.value || ""}
                          onChange={(event) =>
                            field.onChange(event.target.value)
                          }
                          onBlur={field.onBlur}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="semana"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dia da semana *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um dia" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={"SEGUNDA"}>
                            Segunda-feira
                          </SelectItem>
                          <SelectItem value={"TERCA"}>Terça-feira</SelectItem>
                          <SelectItem value={"QUARTA"}>Quarta-feira</SelectItem>
                          <SelectItem value={"QUINTA"}>Quinta-feira</SelectItem>
                          <SelectItem value={"SEXTA"}>Sexta-feira</SelectItem>
                          <SelectItem value={"SABADO"}>Sábado</SelectItem>
                          <SelectItem value={"DOMINGO"}>Domingo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsUpdateModalOpen(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <SaveIcon className="mr-2 h-4 w-4" />
                  )}
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TabelaExpediente;
