"use client";
import {
  createAgendaSchema,
  updateAgendaSchema,
} from "@/app/api/agendas/schema/formSchemaAgendas";
import { Cliente, TipoCliente } from "@/app/types/Cliente";

import { Procedimento } from "@/app/types/Procedimento";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { http } from "@/util/http";
import { updateAgenda } from "@/app/api/agendas/action";
import { cn } from "@/lib/utils";
import { useAgenda } from "../AgendaContext";
import { Convenio } from "@/app/types/Convenios";
import ConveniosCliente from "@/app/types/ConveniosCliente";
import { ValorProcedimento } from "@/app/types/ValorProcedimento";

interface ModalAgendamentoProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  agendamentoSelecionado: any | null;
  horaSelecionada: string | null;
  dataSelecionada: Date | null;
}

const ModalAgendamento = ({
  open,
  setOpen,
  agendamentoSelecionado,
  horaSelecionada,
  dataSelecionada,
}: ModalAgendamentoProps) => {
  const { prestador, unidade, especialidade, carregarAgendamentos } =
    useAgenda();
  const schema = updateAgendaSchema;
  const form = useForm<z.infer<typeof schema>>({
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
      horario: "",
      tipo: "PROCEDIMENTO",
    },
  });

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [procedimentos, setProcedimentos] = useState<ValorProcedimento[]>([]);
  const [loading, setLoading] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(
    null
  );
  const [tipoClienteSelecionado, setTipoClienteSelecionada] =
    useState<TipoCliente>();
  const [convenioSelecionado, setConvenioSelecionada] = useState<Convenio>();
  const [procedimentoSelecionado, setProcedimentoSelecionado] =
    useState<ValorProcedimento>();
  const [openSelectClientes, setOpenSelectClientes] = useState(false);
  const [openSelectProcedimentos, setOpenSelectProcedimentos] = useState(false);

  useEffect(() => {
    fetchClientes();
  }, [clienteSelecionado]);

  useEffect(() => {
    if (convenioSelecionado && tipoClienteSelecionado) {
      fetchProcedimentos(tipoClienteSelecionado, convenioSelecionado.id);
    }
  }, [tipoClienteSelecionado, convenioSelecionado]);

  const fetchClientes = async () => {
    const { data } = await http.get("/clientes");
    setClientes(data.data);
  };

  const fetchConvenios = async (clienteId: number) => {
    if (!clienteId) return;
    const { data } = await http.get(
      `/convenios-clientes?clienteId=${clienteId}`
    );
    const conveniosListRaw = data.data.map(
      (item: ConveniosCliente) => item.convenios
    );
    const conveniosList = Array.from(
      new Map(conveniosListRaw.map((c: Convenio) => [c.id, c])).values()
    ) as Convenio[];

    setConvenios(conveniosList);
  };

  const fetchProcedimentos = async (
    tipoCliente: TipoCliente,
    conveniosId: number
  ) => {
    try {
      const { data } = await http.get(
        `/valores-procedimentos/findByConvenioId?conveniosId=${conveniosId}&tipoCliente=${tipoCliente}`
      );
      setProcedimentos(data);
    } catch (e) {
      toast.error("Nenhum procedimento encontrado");
    }
  };

  useEffect(() => {
    if (dataSelecionada && horaSelecionada) {
      const [h, m] = horaSelecionada.split(":").map(Number);
      const localDate = new Date(
        dataSelecionada.getFullYear(),
        dataSelecionada.getMonth(),
        dataSelecionada.getDate(),
        h,
        m
      );
      const isoDate = new Date(
        localDate.getTime() - localDate.getTimezoneOffset() * 60000
      ).toISOString();
      form.setValue("dtagenda", isoDate);
      form.setValue("horario", horaSelecionada);
    }

    if (prestador) form.setValue("prestadoresId", prestador.id);
    if (unidade) form.setValue("unidadesId", unidade.id);
    if (especialidade) form.setValue("especialidadesId", especialidade.id);
  }, [dataSelecionada, horaSelecionada, prestador, unidade, especialidade]);

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (!procedimentoSelecionado)
        return toast.error("Selecione um procedimento válido");
      await updateAgenda(
        agendamentoSelecionado.dadosAgendamento.id,
        values,
        +procedimentoSelecionado.valor
      );
      toast.success("Agendamento criado com sucesso!");
      await carregarAgendamentos();
      setOpen(false);
    } catch (err) {
      toast.error("Erro ao salvar agendamento");
    } finally {
      setLoading(false);
      setClienteSelecionado(null);
      setConvenioSelecionada(undefined);
      setConvenioSelecionada(undefined);
      form.setValue("conveniosId", 0);
      setProcedimentos([]);
      form.setValue("procedimentosId", 0);
      form.setValue("clientesId", 0);
      setTipoClienteSelecionada(undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Atualizar</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <div className="flex flex-col">
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="clientesId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Clientes *</FormLabel>
                    <Popover
                      open={openSelectClientes}
                      onOpenChange={setOpenSelectClientes}
                    >
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
                              ? clientes.find((item) => +item.id == field.value)
                                  ?.nome
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
                                    setClienteSelecionado(item);
                                    fetchConvenios(+item.id);
                                    setOpenSelectClientes(false);
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
                name="conveniosId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Convênios *</FormLabel>
                    <Select
                      disabled={!clienteSelecionado}
                      onValueChange={(value) => {
                        field.onChange(Number(value));
                        const selectedConvenio = convenios.find(
                          (item) => String(item.id) === value
                        );
                        if (selectedConvenio) {
                          setConvenioSelecionada(selectedConvenio);
                        }
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

              <FormItem>
                <FormLabel>Tipo de Cliente *</FormLabel>
                <Select
                  disabled={!clienteSelecionado}
                  onValueChange={(value) => {
                    setTipoClienteSelecionada(value as TipoCliente);
                  }}
                  value={String(tipoClienteSelecionado)}
                >
                  <FormControl className={"border-gray-300"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="0" disabled>
                      Selecione
                    </SelectItem>

                    {Object.values(TipoCliente).map((item) => {
                      return (
                        <SelectItem key={item} value={String(item)}>
                          {item}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </FormItem>
              <input type="hidden" {...form.register("dtagenda")} />

              <FormField
                control={form.control}
                name="procedimentosId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Procedimentos *</FormLabel>
                    <Popover
                      open={openSelectProcedimentos}
                      onOpenChange={setOpenSelectProcedimentos}
                    >
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
                            {(() => {
                              if (field.value) {
                                const selectedItem = procedimentos.find(
                                  (p) => p.procedimento.id == field.value
                                );
                                if (selectedItem) {
                                  return `${
                                    selectedItem.procedimento.nome
                                  } -  R$${Number(
                                    selectedItem.valor
                                  ).toFixed(2)}`;
                                }
                              } else {
                                return "Selecione procedimento";
                              }
                            })()}
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
                              {procedimentos.map((item) => (
                                <CommandItem
                                  value={item.procedimento.nome}
                                  key={item.procedimento.id}
                                  className="flex items-center justify-between"
                                  onSelect={() => {
                                    form.setValue(
                                      "procedimentosId",
                                      item.procedimento.id
                                    );
                                    setProcedimentoSelecionado(item);

                                    setOpenSelectProcedimentos(false);
                                  }}
                                >
                                  <span>{item.procedimento.nome}</span>
                                  <span className="mx-6">
                                    R${Number(item.valor).toFixed(2)}
                                  </span>
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      item.procedimento.id == field.value
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
                  onClick={() => setOpen(false)}
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
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ModalAgendamento;
