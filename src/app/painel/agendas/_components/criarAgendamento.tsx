"use client";
import { createAgendaSchema } from "@/app/api/agendas/schema/formSchemaAgendas";
import { Convenio } from "@/app/types/Convenios";
import { ValorProcedimento } from "@/app/types/ValorProcedimento"; 
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
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import ConveniosCliente from "@/app/types/ConveniosCliente";
import { Cliente, TipoCliente } from "@/app/types/Cliente";
import { Loader2 } from "lucide-react";

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
      cliente_id: 0,
      convenio_id: 0,
      procedimento_id: 0,
      prestador_id: 0,
      unidade_id: 0,
      especialidade_id: 0,
      dtagenda: "",
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
  const [procedimentoSelecionado, setProcedimentoSelecionado] = useState<
    ValorProcedimento | null
  >(null);

  useEffect(() => {
    form.reset({
      ...form.getValues(),
      prestador_id: prestador?.id || 0,
      unidade_id: unidade?.id || 0,
      especialidade_id: especialidade?.id || 0,
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
      form.setValue("procedimento_id", 0);
    }
  }, [tipoClienteSelecionado, convenioSelecionado]);

  const fetchClientes = async () => {
    try {
      const response = await fetch("/api/clientes");
      if (!response.ok) {
        throw new Error("Erro ao carregar clientes");
      }
      const data = await response.json();
      setClientes(data.data);
    } catch (error) {
      toast.error("Erro ao carregar clientes");
      console.error("Erro ao carregar clientes:", error);
    }
  };

  const fetchConvenios = async (clienteId: number) => {
    if (!clienteId) return;
    try {
      const response = await fetch(
        `/api/convenios-clientes?clienteId=${clienteId}`
      );
      if (!response.ok) {
        throw new Error("Erro ao carregar convênios");
      }
      const data = await response.json();
      const conveniosListRaw = data.data.map(
        (item: ConveniosCliente) => item.convenios
      );
      const conveniosList = Array.from(
        new Map(conveniosListRaw.map((c: Convenio) => [c.id, c])).values()
      ) as Convenio[];

      setConvenios(conveniosList);
      setConvenioSelecionada(undefined);
      form.setValue("convenio_id", 0);
      setProcedimentos([]);
      form.setValue("procedimento_id", 0);
    } catch (error) {
      toast.error("Erro ao carregar convênios para este cliente.");
      setConvenios([]);
      setConvenioSelecionada(undefined);
      form.setValue("convenio_id", 0);
      setProcedimentos([]);
      form.setValue("procedimento_id", 0);
    }
  };

  const fetchProcedimentos = async (
    tipoCliente: TipoCliente,
    conveniosId: number
  ) => {
    try {
      const response = await fetch(
        `/api/valor-procedimento?convenio_id=${conveniosId}&tipoCliente=${tipoCliente}`
      );
      if (!response.ok) {
        throw new Error("Erro ao carregar procedimentos");
      }
      const data = await response.json();
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

      if (!values.cliente_id || values.cliente_id === 0) {
        toast.error("O Cliente é obrigatório.");
        setLoading(false);
        return;
      }
      if (!values.convenio_id || values.convenio_id === 0) {
        toast.error("O Convênio é obrigatório.");
        setLoading(false);
        return;
      }
      if (!values.procedimento_id || values.procedimento_id === 0) {
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
  

      values.prestador_id = prestador?.id;
      values.unidade_id = unidade?.id;
      values.especialidade_id = especialidade?.id;
      delete values.horario;

      const response = await fetch("/api/agendas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar agendamento");
      }

      const result = await response.json();
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Criar Novo Agendamento
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Preencha as informações para criar um novo agendamento
          </p>
        </DialogHeader>
        <Form {...form}>
          <div className="flex flex-col">
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="cliente_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Cliente *</FormLabel>
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
                                "w-full justify-between h-11 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors",
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
                                      form.setValue("cliente_id", +item.id);
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
                        {form.formState.errors.cliente_id?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="convenio_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Convênio *</FormLabel>
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
                        <FormControl>
                          <SelectTrigger className="h-11 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors">
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
                        {form.formState.errors.convenio_id?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div className="flex items-center justify-center">
                   <div className="w-full h-11 bg-gray-50 border border-gray-200 rounded-md flex items-center justify-center">
                     <span className="text-sm text-gray-500">Tipo de Cliente será definido automaticamente</span>
                   </div>
                 </div>

                <FormField
                  control={form.control}
                  name="procedimento_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Procedimentos *</FormLabel>
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
                                "w-full justify-between h-11 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors",
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
                                        "procedimento_id",
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
                        {form.formState.errors.procedimento_id?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />
              </div>

              <input type="hidden" {...form.register("dtagenda")} />

              <DialogFooter className="pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpenModalCreate(false)}
                  className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 font-medium"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Criando...</span>
                    </div>
                  ) : (
                    "Criar Agendamento"
                  )}
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
