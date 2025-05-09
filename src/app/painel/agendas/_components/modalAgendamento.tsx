"use client";
import {
  createAgendaSchema,
  updateAgendaSchema,
} from "@/app/api/agendas/schema/formSchemaAgendas";
import { Cliente } from "@/app/types/Cliente";
import { Convenio } from "@/app/types/Convenios";

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
import { Dispatch, SetStateAction, useEffect, useState } from "react";
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
import { Agenda } from "@/app/types/Agenda";
import { toast } from "sonner";
import { http } from "@/util/http";
import { Prestador } from "@/app/types/Prestador";
import { Unidade } from "@/app/types/Unidades";
import { Especialidade } from "@/app/types/Especialidade";
import { createAgenda, updateAgenda } from "@/app/api/agendas/action";
import { cn } from "@/lib/utils";
import { useAgenda } from "../AgendaContext";

interface ModalAgendamentoProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  method: "POST" | "PATCH";
  agendamentoSelecionado: any | null;
  horaSelecionada: string | null;
  dataSelecionada: Date | null;
}

const ModalAgendamento = ({
  open,
  setOpen,
  method,
  agendamentoSelecionado,
  horaSelecionada,
  dataSelecionada,
}: ModalAgendamentoProps) => {
  const { prestador, unidade, especialidade, carregarAgendamentos } =
    useAgenda();
  const schema = method === "POST" ? createAgendaSchema : updateAgendaSchema;
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
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [loading, setLoading] = useState(false);

  const [openSelectClientes, setOpenSelectClientes] = useState(false);
  const [openSelectProcedimentos, setOpenSelectProcedimentos] = useState(false);

  // Carregar dados
  useEffect(() => {
    fetchClientes();
    fetchConvenios();
    fetchProcedimentos();
  }, []);

  const fetchClientes = async () => {
    const { data } = await http.get("http://localhost:3000/clientes");
    setClientes(data.data);
  };
  const fetchConvenios = async () => {
    const { data } = await http.get("http://localhost:3000/convenios");
    setConvenios(data.data);
  };
  const fetchProcedimentos = async () => {
    const { data } = await http.get("http://localhost:3000/procedimentos");
    setProcedimentos(data.data);
  };

  // Atualizar form com dados selecionados
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

  // Envio do form
  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (method === "PATCH" && agendamentoSelecionado) {
        await updateAgenda(agendamentoSelecionado.dadosAgendamento.id, values);
        toast.success("Agendamento atualizado com sucesso");
      } else {
        await createAgenda(values);
        toast.success("Agendamento criado com sucesso");
      }
      await carregarAgendamentos();
      setOpen(false);
    } catch (err) {
      toast.error("Erro ao salvar agendamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {method == "PATCH" ? "Atualizar" : "Novo"} Agendamento{" "}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <div className="flex flex-col">
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
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
                  <FormField
                    control={form.control}
                    name="horario"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horários *</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            value={field.value ?? ""}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage>
                          {form.formState.errors.horario?.message}
                        </FormMessage>
                      </FormItem>
                    )}
                  />

                  <input type="hidden" {...form.register("procedimentosId")} />
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
                            {field.value
                              ? procedimentos.find((p) => p.id == field.value)
                                  ?.nome
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
                                    setOpenSelectProcedimentos(false);
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
