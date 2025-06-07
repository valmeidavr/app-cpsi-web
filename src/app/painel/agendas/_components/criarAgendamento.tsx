"use client";
import { createAgendaSchema } from "@/app/api/agendas/schema/formSchemaAgendas";

import { Convenio } from "@/app/types/Convenios";
import { ValorProcedimento } from "@/app/types/ValorProcedimento"; // Importação correta
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
  Form,
  FormControl,
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
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAgenda } from "../AgendaContext";
import { http } from "@/util/http";
import { createAgenda } from "@/app/api/agendas/action";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import ConveniosCliente from "@/app/types/ConveniosCliente";
import { Cliente, TipoCliente } from "@/app/types/Cliente";

interface CriarAgendamentoProps {
  isOpenModalCreate: boolean;
  setIsOpenModalCreate: (open: boolean) => void;
  dataSelecionada: Date | null;
}

const CriarAgendamento = ({
  isOpenModalCreate,
  setIsOpenModalCreate,
  dataSelecionada,
}: CriarAgendamentoProps) => {
  const { prestador, unidade, especialidade, carregarAgendamentos } =
    useAgenda();
  const form = useForm<z.infer<typeof createAgendaSchema>>({
    resolver: zodResolver(createAgendaSchema),
    mode: "onChange",
    defaultValues: {
      situacao: "AGENDADO",
      clientesId: 0,
      conveniosId: 0,
      procedimentosId: 0,
      prestadoresId: 0,
      unidadesId: 0,
      especialidadesId: 0,
      dtagenda: "",
      horario: "",
      tipo: "PROCEDIMENTO",
    },
  });

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [procedimentos, setProcedimentos] = useState<ValorProcedimento[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [loading, setLoading] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(
    null
  );
  const [horaSelecionada, setHoraSelecionada] = useState<string | null>(null);
  const [openSelectClientes, setOpenSelectClientes] = useState(false);
  const [openSelectProcedimentos, setOpenSelectProcedimentos] = useState(false);
  const [tipoClienteSelecionado, setTipoClienteSelecionada] =
    useState<TipoCliente>(TipoCliente.NSOCIO);
  const [convenioSelecionado, setConvenioSelecionada] = useState<
    Convenio | undefined
  >(undefined);

  useEffect(() => {
    form.reset({
      ...form.getValues(),
      prestadoresId: prestador?.id || 0,
      unidadesId: unidade?.id || 0,
      especialidadesId: especialidade?.id || 0,
      dtagenda: dataSelecionada
        ? new Date(
            dataSelecionada.getTime() -
              dataSelecionada.getTimezoneOffset() * 60000
          ).toISOString()
        : "",
    });
  }, [prestador, unidade, especialidade, dataSelecionada, form.reset]);

  useEffect(() => {
    fetchClientes();
  }, []);

  useEffect(() => {
    if (convenioSelecionado && tipoClienteSelecionado) {
      fetchProcedimentos(tipoClienteSelecionado, convenioSelecionado.id);
    } else {
      setProcedimentos([]);
      form.setValue("procedimentosId", 0);
    }
  }, [tipoClienteSelecionado, convenioSelecionado]);

  const fetchClientes = async () => {
    const { data } = await http.get("/clientes");
    setClientes(data.data);
  };

  const fetchConvenios = async (clienteId: number) => {
    if (!clienteId) return;
    try {
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
      setConvenioSelecionada(undefined);
      form.setValue("conveniosId", 0);
      setProcedimentos([]);
      form.setValue("procedimentosId", 0);
    } catch (error) {
      toast.error("Erro ao carregar convênios para este cliente.");
      setConvenios([]);
      setConvenioSelecionada(undefined);
      form.setValue("conveniosId", 0);
      setProcedimentos([]);
      form.setValue("procedimentosId", 0);
    }
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
      toast.error(
        "Nenhum procedimento encontrado para este convênio/tipo de cliente."
      );
      setProcedimentos([]); 
    }
  };


  const onSubmit = async (values: any) => {
    setLoading(true);

    try {
      if (!unidade?.id || !prestador?.id || !especialidade?.id) {
        toast.error(
          "Unidade, Prestador e Especialidade devem ser selecionados na tela principal antes de agendar."
        );
        setLoading(false);
        return;
      }
      if (!dataSelecionada || !values.horario) {
        toast.error(
          "Data e horário são obrigatórios para criar o agendamento."
        );
        setLoading(false);
        return;
      }

      if (!values.clientesId || values.clientesId === 0) {
        toast.error("O Cliente é obrigatório.");
        setLoading(false);
        return;
      }
      if (!values.conveniosId || values.conveniosId === 0) {
        toast.error("O Convênio é obrigatório.");
        setLoading(false);
        return;
      }
      if (!values.procedimentosId || values.procedimentosId === 0) {
        toast.error("O Procedimento é obrigatório.");
        setLoading(false);
        return;
      }
      const [horas, minutos] = values.horario.split(":").map(Number);

      const ano = dataSelecionada.getFullYear();
      const mes = (dataSelecionada.getMonth() + 1).toString().padStart(2, "0"); 
      const dia = dataSelecionada.getDate().toString().padStart(2, "0");
      const horasFormatadas = horas.toString().padStart(2, "0");
      const minutosFormatados = minutos.toString().padStart(2, "0");
      values.dtagenda = `${ano}-${mes}-${dia}T${horasFormatadas}:${minutosFormatados}:00.000Z`;
  

      values.prestadoresId = prestador?.id;
      values.unidadesId = unidade?.id;
      values.especialidadesId = especialidade?.id;
      delete values.horario;

      await createAgenda(values);
      toast.success("Agendamento criado com sucesso!");
      await carregarAgendamentos(); 
    } catch (e: any) {
      console.error("Erro ao salvar agendamento:", e);
      toast.error(
        `Erro ao salvar agendamento: ${
          e.message || "Verifique os dados e tente novamente."
        }`
      );
    } finally {
      setLoading(false);
      setIsOpenModalCreate(false);
      form.reset(); 
      setClienteSelecionado(null);
      setConvenioSelecionada(undefined);
      setTipoClienteSelecionada(TipoCliente.NSOCIO);
      setConvenios([]);
      setProcedimentos([]);
      setHoraSelecionada(null);
    }
  };

  return (
    <Dialog open={isOpenModalCreate} onOpenChange={setIsOpenModalCreate}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Encaixe</DialogTitle>{" "}
        </DialogHeader>
        <Form {...form}>
          <div className="flex flex-col">
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <div>
                <FormField
                  control={form.control}
                  name="horario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário *</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            field.onChange(e);
                            setHoraSelecionada(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage>
                        {form.formState.errors.horario?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />

               
                <input type="hidden" {...form.register("unidadesId")} />
                <input type="hidden" {...form.register("prestadoresId")} />
                <input type="hidden" {...form.register("especialidadesId")} />
              </div>

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
                              ? clientes.find(
                                  (item) => +item.id === field.value
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
                                    setClienteSelecionado(item);
                                    fetchConvenios(+item.id);
                                    setOpenSelectClientes(false);
                                  }}
                                >
                                  {item.nome}
                                  <Check
                                    className={cn(
                                      "ml-auto",
                                      +item.id === field.value
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
                      disabled={!clienteSelecionado || convenios.length === 0}
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
                          form.formState.errors.conveniosId
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

              {/* Input hidden para dtagenda, já que ele é preenchido no onSubmit */}
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
                  onClick={() => setIsOpenModalCreate(false)}
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

export default CriarAgendamento;
