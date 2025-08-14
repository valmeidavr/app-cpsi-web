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
import { localDateToUTCISO } from "@/app/helpers/dateUtils";
import { cn } from "@/lib/utils";
import { useAgenda } from "../AgendaContext";
import { Convenio } from "@/app/types/Convenios";
import { ValorProcedimento } from "@/app/types/ValorProcedimento";
import { Loader2 } from "lucide-react";

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
      cliente_id: 0,
      convenio_id: 0,
      procedimento_id: 0,
      prestador_id: prestador?.id ?? 0,
      unidade_id: unidade?.id ?? 0,
      especialidade_id: especialidade?.id ?? 0,
      dtagenda: "",
      horario: "",
      tipo: "PROCEDIMENTO",
      tipo_cliente: "NSOCIO",
    },
  });

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [procedimentos, setProcedimentos] = useState<ValorProcedimento[]>([]);
  const [loading, setLoading] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(
    null
  );
  const [convenioSelecionado, setConvenioSelecionado] = useState<Convenio | null>(
    null
  );
  const [procedimentoSelecionado, setProcedimentoSelecionado] = useState<ValorProcedimento | null>(
    null
  );
  const [tipoClienteSelecionado, setTipoClienteSelecionado] = useState<TipoCliente | null>(
    null
  );
  const [openSelectClientes, setOpenSelectClientes] = useState(false);
  const [openSelectProcedimentos, setOpenSelectProcedimentos] = useState(false);
  const [openSelectConvenios, setOpenSelectConvenios] = useState(false);
  const [searchCliente, setSearchCliente] = useState("");
  const [searchProcedimento, setSearchProcedimento] = useState("");
  const [searchConvenio, setSearchConvenio] = useState("");

  useEffect(() => {
    if (open) {
      fetchClientes();
      // Resetar o tipo de cliente quando o modal é aberto
      setTipoClienteSelecionado(null);
      form.setValue("tipo_cliente", "NSOCIO");
    }
  }, [open]);

  useEffect(() => {
    if (clienteSelecionado) {
      fetchConvenios(clienteSelecionado.id);
    } else {
      setConvenios([]);
      form.setValue("convenio_id", 0);
      setProcedimentos([]);
      form.setValue("procedimento_id", 0);
    }
  }, [clienteSelecionado]);

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
        const errorData = await response.json();
        throw new Error(`Erro ao carregar clientes: ${response.status} - ${errorData.error || 'Erro desconhecido'}`);
      }
      
      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        setClientes(data.data);
      } else {
        setClientes([]);
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      toast.error("Erro ao carregar clientes");
      setClientes([]);
    }
  };

  const fetchConvenios = async (clienteId: number) => {
    if (!clienteId) return;
    try {
      const response = await fetch(`/api/convenios-clientes?clienteId=${clienteId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
          const conveniosList = data.data.map((item: any) => ({
            id: item.convenioId,
            nome: item.nome,
            regras: item.regras,
            tabela_faturamento_id: item.tabela_faturamentos_id,
            desconto: item.desconto
          })) as Convenio[];

          setConvenios(conveniosList);
          setConvenioSelecionado(null);
          form.setValue("convenio_id", 0);
          setProcedimentos([]);
          form.setValue("procedimento_id", 0);
          return;
        }
      }
      
      const fallbackResponse = await fetch("/api/convenios?limit=1000");
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        setConvenios(fallbackData.data || []);
        setConvenioSelecionado(null);
        form.setValue("convenio_id", 0);
        setProcedimentos([]);
        form.setValue("procedimento_id", 0);
      } else {
        throw new Error("Erro ao carregar convênios");
      }
      
    } catch (error) {
      console.error("Erro ao carregar convênios:", error);
      toast.error("Erro ao carregar convênios para este cliente.");
      setConvenios([]);
      setConvenioSelecionado(null);
      form.setValue("convenio_id", 0);
      setProcedimentos([]);
      form.setValue("procedimento_id", 0);
    }
  };

  const fetchProcedimentos = async (
    tipoCliente: TipoCliente,
    convenio_id: number
  ) => {
    try {
      const response = await fetch(
        `/api/valor-procedimento?convenio_id=${convenio_id}&tipoCliente=${String(tipoCliente)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setProcedimentos(data.data || []);
      } else {
        throw new Error("Erro ao carregar procedimentos");
      }
    } catch (e) {
      console.error("Erro ao carregar procedimentos:", e);
      toast.error("Nenhum procedimento encontrado");
      setProcedimentos([]);
    }
  };

  useEffect(() => {
    if (dataSelecionada && horaSelecionada) {
      // Usar a função utilitária para criar a data UTC ISO
      const dtagenda = localDateToUTCISO(dataSelecionada, horaSelecionada);
      form.setValue("dtagenda", dtagenda);
      form.setValue("horario", horaSelecionada);
    }

    if (prestador) form.setValue("prestador_id", prestador.id);
    if (unidade) form.setValue("unidade_id", unidade.id);
    if (especialidade) form.setValue("especialidade_id", especialidade.id);
  }, [dataSelecionada, horaSelecionada, prestador, unidade, especialidade]);

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (!procedimentoSelecionado)
        return toast.error("Selecione um procedimento válido");
      
      if (!tipoClienteSelecionado)
        return toast.error("O Tipo de Cliente é obrigatório");
      
      // Adicionar o tipo_cliente aos dados
      const dadosParaEnviar = {
        ...values,
        tipo_cliente: tipoClienteSelecionado || values.tipo_cliente
      };
      
      const response = await fetch(
        `/api/agendas/${agendamentoSelecionado.dadosAgendamento.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dadosParaEnviar),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao atualizar agendamento");
      }

      toast.success("Agendamento atualizado com sucesso!");
      await carregarAgendamentos();
      setOpen(false);
    } catch (err: any) {
      toast.error(`Erro ao salvar agendamento: ${err.message || "Erro desconhecido"}`);
    } finally {
      setLoading(false);
      setClienteSelecionado(null);
      setConvenioSelecionado(null);
      form.setValue("convenio_id", 0);
      setProcedimentos([]);
      form.setValue("procedimento_id", 0);
      form.setValue("cliente_id", 0);
      setTipoClienteSelecionado(null);
      form.setValue("tipo_cliente", "NSOCIO");
      setSearchCliente("");
      setSearchProcedimento("");
      setSearchConvenio("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Editar Agendamento
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Atualize as informações do agendamento selecionado
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
                                ? clientes.find((cliente) => cliente.id === field.value)?.nome
                                : "Selecione o cliente"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder="Busque por nome, CPF ou email..."
                              value={searchCliente}
                              onValueChange={setSearchCliente}
                            />
                            <CommandList>
                              <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                              <CommandGroup>
                                {clientes
                                  .filter((cliente) =>
                                    cliente.nome.toLowerCase().includes(searchCliente.toLowerCase()) ||
                                    cliente.cpf?.includes(searchCliente) ||
                                    cliente.email?.toLowerCase().includes(searchCliente.toLowerCase())
                                  )
                                  .map((cliente) => (
                                    <CommandItem
                                      key={cliente.id}
                                      value={cliente.nome}
                                      onSelect={() => {
                                        field.onChange(cliente.id);
                                        setClienteSelecionado(cliente);
                                        setTipoClienteSelecionado(cliente.tipo);
                                        fetchConvenios(cliente.id);
                                        setOpenSelectClientes(false);
                                        setSearchCliente("");
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === cliente.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <div className="flex flex-col">
                                        <span className="font-medium">{cliente.nome}</span>
                                        <span className="text-xs text-gray-500">
                                          {cliente.cpf ? `CPF: ${cliente.cpf}` : ""}
                                          {cliente.email ? ` | Email: ${cliente.email}` : ""}
                                        </span>
                                      </div>
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="convenio_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Convênio *</FormLabel>
                      <Popover
                        open={openSelectConvenios}
                        onOpenChange={setOpenSelectConvenios}
                      >
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              disabled={!clienteSelecionado}
                              className={cn(
                                "w-full justify-between h-11 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? convenios.find((convenio) => convenio.id === field.value)?.nome
                                : "Selecione o convênio"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder="Busque por nome do convênio..."
                              value={searchConvenio}
                              onValueChange={setSearchConvenio}
                            />
                            <CommandList>
                              <CommandEmpty>Nenhum convênio encontrado.</CommandEmpty>
                              <CommandGroup>
                                {convenios
                                  .filter((convenio) =>
                                    convenio.nome.toLowerCase().includes(searchConvenio.toLowerCase())
                                  )
                                  .map((convenio) => (
                                    <CommandItem
                                      key={convenio.id}
                                      value={convenio.nome}
                                      onSelect={() => {
                                        field.onChange(convenio.id);
                                        setConvenioSelecionado(convenio);
                                        setOpenSelectConvenios(false);
                                        setSearchConvenio("");
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === convenio.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <span>{convenio.nome}</span>
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="procedimento_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Procedimento *</FormLabel>
                      <Popover
                        open={openSelectProcedimentos}
                        onOpenChange={setOpenSelectProcedimentos}
                      >
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              disabled={!convenioSelecionado || !tipoClienteSelecionado}
                              className={cn(
                                "w-full justify-between h-11 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? procedimentos.find((proc) => proc.procedimento.id === field.value)?.procedimento.nome
                                : !convenioSelecionado 
                                  ? "Selecione o convênio primeiro" 
                                  : !tipoClienteSelecionado 
                                    ? "Selecione o tipo de cliente primeiro"
                                    : "Selecione o procedimento"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput
                              placeholder="Busque por nome ou código do procedimento..."
                              value={searchProcedimento}
                              onValueChange={setSearchProcedimento}
                            />
                            <CommandList>
                              <CommandEmpty>Nenhum procedimento encontrado.</CommandEmpty>
                              <CommandGroup>
                                {procedimentos
                                  .filter((proc) =>
                                    proc.procedimento.nome.toLowerCase().includes(searchProcedimento.toLowerCase()) ||
                                    proc.procedimento.codigo?.toLowerCase().includes(searchProcedimento.toLowerCase())
                                  )
                                  .map((proc) => (
                                    <CommandItem
                                      key={proc.procedimento.id}
                                      value={proc.procedimento.nome}
                                      onSelect={() => {
                                        field.onChange(proc.procedimento.id);
                                        setProcedimentoSelecionado(proc);
                                        setOpenSelectProcedimentos(false);
                                        setSearchProcedimento("");
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === proc.procedimento.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <div className="flex flex-col">
                                        <span className="font-medium">{proc.procedimento.nome}</span>
                                        <span className="text-xs text-gray-500">
                                          {proc.procedimento.codigo ? `Código: ${proc.procedimento.codigo}` : ""}
                                          {proc.valor ? ` | Valor: R$ ${Number(proc.valor).toFixed(2)}` : ""}
                                        </span>
                                      </div>
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo_cliente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Tipo Cliente *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setTipoClienteSelecionado(value as TipoCliente);
                          // Limpar procedimento selecionado quando tipo mudar
                          setProcedimentoSelecionado(null);
                          form.setValue("procedimento_id", 0);
                          // Recarregar procedimentos se já há convênio selecionado
                          if (convenioSelecionado) {
                            fetchProcedimentos(value as TipoCliente, convenioSelecionado.id);
                          }
                        }}
                        value={field.value || tipoClienteSelecionado || "NSOCIO"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SOCIO">SOCIO</SelectItem>
                          <SelectItem value="NSOCIO">NSOCIO</SelectItem>
                          <SelectItem value="PARCEIRO">PARCEIRO</SelectItem>
                          <SelectItem value="FUNCIONARIO">FUNCIONARIO</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="situacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Situação</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors">
                            <SelectValue placeholder="Selecione a situação" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="LIVRE">Livre</SelectItem>
                          <SelectItem value="AGENDADO">Agendado</SelectItem>
                          <SelectItem value="CONFIRMADO">Confirmado</SelectItem>
                          <SelectItem value="FINALIZADO">Finalizado</SelectItem>
                          <SelectItem value="FALTA">Falta</SelectItem>
                          <SelectItem value="BLOQUEADO">Bloqueado</SelectItem>
                          <SelectItem value="INATIVO">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
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
                      <span>Salvando...</span>
                    </div>
                  ) : (
                    "Salvar Alterações"
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

export default ModalAgendamento;
