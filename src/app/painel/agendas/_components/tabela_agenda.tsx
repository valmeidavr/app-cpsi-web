"use client";
import {
  createAgenda,
  finalizarAgenda,
  getAgendaById,
  updateAgenda,
} from "@/app/api/agendas/action";
import {
  createAgendaSchema,
  updateAgendaSchema,
} from "@/app/api/agendas/schema/formSchemaAgendas";
import { getClientes } from "@/app/api/clientes/action";
import { getConvenios } from "@/app/api/convenios/action";
import { getProcedimentos } from "@/app/api/procedimentos/action";
import { Agenda } from "@/app/types/Agenda";
import { Cliente } from "@/app/types/Cliente";
import { Convenio } from "@/app/types/Convenios";
import { Especialidade } from "@/app/types/Especialidade";
import { Prestador } from "@/app/types/Prestador";
import { Procedimento } from "@/app/types/Procedimento";
import { Unidade } from "@/app/types/Unidades";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { cn } from "@/lib/utils";
import { http } from "@/util/http";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Check, ChevronsUpDown, Loader2, MenuIcon } from "lucide-react";
import { ReactEventHandler, useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

interface TabelaAgendaProps {
  carregandoDadosAgenda: boolean;
  date: Date | undefined;
  horariosDia: any[];
  prestador: Prestador;
  unidade: Unidade;
  especialidade: Especialidade;
  carregarAgendamentos: () => {};
}

const TabelaAgenda = ({
  carregandoDadosAgenda,
  date,
  horariosDia,
  prestador,
  unidade,
  especialidade,
  carregarAgendamentos,
}: TabelaAgendaProps) => {
  const [ModalAgendamento, setModalAgendamento] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [horaSelecionada, setHoraSelecionada] = useState<string | null>(null);
  const [dataSelecionada, setDataSelecionada] = useState<Date | null>(null);
  const [agendamenetoSelecionado, setAgendamentoSelecionado] = useState<
    any | null
  >(null);
  const [method, setMethod] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  const schema = method === "POST" ? createAgendaSchema : updateAgendaSchema;

  const form = useForm<
    z.infer<typeof createAgendaSchema | typeof updateAgendaSchema>
  >({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      situacao: "AGENDADO",
      clientesId: 0,
      conveniosId: 0,
      procedimentosId: 0,
      prestadoresId: prestador?.id ?? 0,
      unidadesId: unidade?.id ?? 0,
      especialidadesId: especialidade?.id ?? 0,
      dtagenda: "",
    },
  });

  useEffect(() => {
    fetchClientes();
    fetchConvenios();
    fetchProcedimentos();
  }, []);

  const fetchClientes = async () => {
    try {
      const { data } = await await http.get("http://localhost:3000/clientes");
      setClientes(data.data);
    } catch (error: any) {
      toast.error("Erro ao carregar dados dos Clientes");
    }
  };
  const fetchConvenios = async () => {
    try {
      const { data } = await http.get("http://localhost:3000/convenios");
      console.log("Convenios:", data.data);
      setConvenios(data.data);
    } catch (error: any) {
      toast.error("Erro ao carregar dados dos Convenios");
    }
  };
  const fetchProcedimentos = async () => {
    try {
      const { data } = await await http.get(
        "http://localhost:3000/procedimentos"
      );
      setProcedimentos(data.data);
    } catch (error: any) {
      toast.error("Erro ao carregar dados dos Procedimentos");
    }
  };

  const abrirModalAgendamento = async (hora: string, data: Date) => {
    setHoraSelecionada(hora);
    setDataSelecionada(data);
    if (method == "PATCH")
      try {
        if (!agendamenetoSelecionado)
          throw new Error("agendamento não selecionado");
        const data = await getAgendaById(
          agendamenetoSelecionado.dadosAgendamento.id.toString()
        );

        form.reset({
          conveniosId: data.conveniosId,
          clientesId: data.clientesId,
          procedimentosId: data.procedimentosId,
        });
      } catch (error) {
        console.error("Erro ao carregar dados do agendamento:", error);
      } finally {
      }
    setModalAgendamento(true);
  };

  useEffect(() => {
    if (ModalAgendamento && horaSelecionada && dataSelecionada) {
      const [hour, minute] = horaSelecionada.split(":").map(Number);

      const dataLocal = new Date(
        dataSelecionada.getFullYear(),
        dataSelecionada.getMonth(),
        dataSelecionada.getDate(),
        hour,
        minute,
        0
      );
      const dataUTC = new Date(
        dataLocal.getTime() - dataLocal.getTimezoneOffset() * 60000
      );

      // Define no formulário no formato ISO (com Z no final)
      form.setValue("dtagenda", dataUTC.toISOString());
    }
  }, [ModalAgendamento, horaSelecionada, dataSelecionada]);

  useEffect(() => {
    if (prestador) {
      form.setValue("prestadoresId", prestador.id);
    }
    if (unidade) {
      form.setValue("unidadesId", unidade.id);
    }
    if (especialidade) {
      form.setValue("especialidadesId", especialidade.id);
    }
  }, [prestador, unidade, especialidade]);

  const excluirAgendamento = async (agendaId: number) => {
    try {
      await finalizarAgenda(agendaId.toString());
      console.log("values:", agendaId);
      toast.error(
        `Agendamento do dia ${
          dataSelecionada && format(dataSelecionada, "dd/MM/yyyy")
        } às ${horaSelecionada} foi deletado com sucesso!`
      );
      await carregarAgendamentos();
    } catch (error: any) {
      toast.error("Não foi posssivel deletar o agendamento", error);
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  const onSubmit = async (values: any) => {
    setLoading(true);
    if (method == "POST") {
      try {
        await createAgenda(values);
        console.log("values:", values);
        toast.success(
          `Agendamento concluido para ${
            dataSelecionada && format(dataSelecionada, "dd/MM/yyyy")
          } às ${horaSelecionada}`
        );
        await carregarAgendamentos();
      } catch (error: any) {
        toast.error("Não foi posssivel fazer o agendamento", error);
      } finally {
        setLoading(false);
        setModalAgendamento(false);
      }
    } else if (method == "PATCH") {
      try {
        if (!agendamenetoSelecionado) return;
        await updateAgenda(
          agendamenetoSelecionado.dadosAgendamento.id.toString(),
          values
        );
        toast.success(
          `Agendamento da data ${
            dataSelecionada && format(dataSelecionada, "dd/MM/yyyy")
          } às ${horaSelecionada} atualizado com sucesso!`
        );
        await carregarAgendamentos();
      } catch (error: any) {
        toast.error("Não foi posssivel alterar o agendamento", error);
      } finally {
        setLoading(false);
        setModalAgendamento(false);
      }
    } else {
      throw new Error("method inválido");
    }
  };
  return (
    <>
      {date && (
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Agendamentos do Dia:{" "}
          <span className="text-blue-600">{format(date, "dd/MM/yyyy")}</span>
        </h3>
      )}
      <Table className="text-xs min-w-full">
        <TableHeader className="bg-gray-100 sticky top-0 z-10">
          <TableRow>
            <TableHead className="text-center">Horário</TableHead>
            <TableHead className="text-center">Paciênte</TableHead>
            <TableHead className="text-center">Tipo</TableHead>
            <TableHead className="text-center">Situação</TableHead>
            <TableHead className="text-center">Opções</TableHead>
          </TableRow>
        </TableHeader>
        {carregandoDadosAgenda ? (
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
            {date ? (
              horariosDia.map((agenda, index) => (
                <TableRow key={index}>
                  <TableCell>{agenda.hora}</TableCell>
                  <TableCell>
                    {agenda.paciente ? (
                      (() => {
                        const partes = agenda.paciente.split(" ");
                        return partes.length > 1
                          ? `${partes[0]}  ${partes[partes.length - 1]}`
                          : partes;
                      })()
                    ) : (
                      <span className="text-gray-400 italic">
                        Paciente não definido
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{agenda.tipo || "-"}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        agenda.situacao === "LIVRE"
                          ? "bg-green-50 text-green-600"
                          : agenda.situacao === "CONFIRMADO"
                          ? "bg-yellow-100 text-yellow-700"
                          : agenda.situacao === "FINALIZADO"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {agenda.situacao}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <MenuIcon />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {agenda.situacao === "LIVRE" ? (
                          <DropdownMenuItem
                            onSelect={() => {
                              setMethod("POST");
                              setAgendamentoSelecionado(null);
                              abrirModalAgendamento(agenda.hora, date);
                            }}
                          >
                            Fazer Agendamento
                          </DropdownMenuItem>
                        ) : (
                          <>
                            <DropdownMenuItem
                              onSelect={() =>
                                alert(`Ver agendamento de ${agenda.paciente}`)
                              }
                            >
                              Ver Agenda
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => {
                                setHoraSelecionada(agenda.hora);
                                setDataSelecionada(date);
                                setIsDeleteModalOpen(true);
                                setAgendamentoSelecionado(agenda);
                              }}
                            >
                              Excluir Agendamento
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => {
                                setMethod("PATCH");
                                abrirModalAgendamento(agenda.hora, date);
                                setAgendamentoSelecionado(agenda);
                              }}
                            >
                              Editar Agendamento
                            </DropdownMenuItem>
                          </>
                        )}
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
                      Data não definida
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        )}
      </Table>
      {/* ✅ Diálogo de Confirmação */}
      <Dialog open={ModalAgendamento} onOpenChange={setModalAgendamento}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Agendamento </DialogTitle>
          </DialogHeader>
          <FormProvider {...form}>
            <div className="flex flex-col">
              <form
                className="space-y-4"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <FormField
                  control={form.control}
                  name="conveniosId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Convênios *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(Number(value));
                        }}
                        value={String(field.value)}
                      >
                        <FormControl
                          className={
                            form.formState.errors.situacao
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
                          {convenios.map((item) => {
                            return (
                              <SelectItem key={item.id} value={String(item.id)}>
                                {item.nome}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage>
                        {form.formState.errors.conveniosId?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />
                <input type="hidden" {...form.register("dtagenda")} />
                {method == "POST" ? (
                  <div>
                    <input
                      type="hidden"
                      {...form.register("procedimentosId")}
                    />
                    <input type="hidden" {...form.register("unidadesId")} />
                    <input type="hidden" {...form.register("prestadoresId")} />
                  </div>
                ) : (
                  ""
                )}

                <FormField
                  control={form.control}
                  name="clientesId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Clientes *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? clientes.find(
                                    (item) => +item.id == field.value
                                  )?.nome
                                : "Selecione o cliente"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command className="w-[480px] p-0">
                            <CommandInput placeholder="Busque cliente..." />
                            <CommandList>
                              <CommandEmpty>
                                Nenhum cliente encontrado.
                              </CommandEmpty>
                              <CommandGroup className="w-full p-0">
                                {clientes.map((item) => (
                                  <CommandItem
                                    value={item.nome.toString()}
                                    key={item.id}
                                    onSelect={() => {
                                      form.setValue("clientesId", +item.id);
                                    }}
                                  >
                                    {item.nome}
                                    <Check
                                      className={cn(
                                        "ml-auto",
                                        +item.id == field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage>
                        {form.formState.errors.clientesId?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="procedimentosId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Procedimentos *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? procedimentos.find(
                                    (procedimento) =>
                                      procedimento.id == field.value
                                  )?.nome
                                : "Selecione procedimento"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command className="w-[480px] p-0">
                            <CommandInput placeholder="Busque procedimento..." />
                            <CommandList>
                              <CommandEmpty>
                                Nenhum procedimento encontrado.
                              </CommandEmpty>
                              <CommandGroup className="w-full p-0">
                                {procedimentos.map((procedimento) => (
                                  <CommandItem
                                    value={procedimento.id.toString()}
                                    key={procedimento.id}
                                    onSelect={() => {
                                      form.setValue(
                                        "procedimentosId",
                                        procedimento.id
                                      );
                                    }}
                                  >
                                    {procedimento.nome}
                                    <Check
                                      className={cn(
                                        "ml-auto",
                                        procedimento.id == field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage>
                        {form.formState.errors.procedimentosId?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    variant="secondary"
                    onClick={() => setModalAgendamento(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button variant="default" type="submit" disabled={loading}>
                    Salvar Agendamento
                  </Button>
                </DialogFooter>
              </form>
            </div>
          </FormProvider>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Agendamento </DialogTitle>
          </DialogHeader>
          Tem certeza que deseja excluir o agendamento do dia {dataSelecionada && format(dataSelecionada!, "dd/MM/yyyy")} no horário {horaSelecionada}
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() =>
                excluirAgendamento(agendamenetoSelecionado.dadosAgendamento.id)
              }
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button variant="destructive" type="submit" disabled={loading}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TabelaAgenda;
