"use client";
import {
  createAgendaSchema,
  updateAgendaSchema,
} from "@/app/api/agendas/schema/formSchemaAgendas";
import { Cliente } from "@/app/types/Cliente";
import { TipoCliente as TipoClienteValorProcedimento } from "@/app/types/ValorProcedimento";

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
  agendamentoSelecionado: {
    id: number;
    cliente_id: number;
    convenio_id: number;
    procedimento_id: number;
    dtagenda: string;
    situacao: string;
  } | null;
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
      cliente_id: 0,
      convenio_id: 0,
      procedimento_id: 0,
      prestador_id: prestador?.id ?? 0,
      unidade_id: unidade?.id ?? 0,
      especialidade_id: especialidade?.id ?? 0,
      dtagenda: "",
      horario: "",
      tipo: "PROCEDIMENTO",
      tipo_cliente: undefined, // Inicialmente undefined
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
  const [tipoClienteSelecionado, setTipoClienteSelecionado] = useState<TipoClienteValorProcedimento | null>(null); // Inicialmente null
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
      form.setValue("tipo_cliente", undefined);
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
      const response = await fetch(`/api/convenios-clientes?cliente_id=${clienteId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
          const conveniosList = data.data.map((item: {
            convenioId: number;
            nome: string;
            regras: string;
            tabela_faturamentos_id: number;
            desconto: number;
          }) => ({
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
      
      // Fallback: buscar todos os convênios se não houver convênios específicos do cliente
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
      console.error("❌ Erro ao carregar convênios:", error);
      toast.error("Erro ao carregar convênios para este cliente.");
      setConvenios([]);
      setConvenioSelecionado(null);
      form.setValue("convenio_id", 0);
      setProcedimentos([]);
      form.setValue("procedimento_id", 0);
    }
  };

  const fetchProcedimentos = async (
    tipoCliente: TipoClienteValorProcedimento,
    convenio_id: number
  ) => {
    try {
      const response = await fetch(
        `/api/valor-procedimento?convenio_id=${convenio_id}&tipoCliente=${String(tipoCliente)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        
        // A API retorna um array diretamente, não data.data
        if (Array.isArray(data)) {
          // Mapear os dados corretamente baseado na estrutura real retornada
          const procedimentosMapeados = data.map((item: {
            id: number;
            valor: number;
            tipo: string;
            tabela_faturamento_id: number;
            procedimento_id: number;
            createdAt: string;
            updatedAt: string;
            procedimento: {
              id: number;
              nome: string;
              codigo: string;
              tipo: string;
              especialidade_id: number;
              status: string;
              createdAt: string;
              updatedAt: string;
            };
          }) => ({
            id: item.id,
            valor: item.valor.toString(),
            tipo: item.tipo as TipoClienteValorProcedimento,
            tabela_faturamento_id: item.tabela_faturamento_id || 1,
            procedimento_id: item.procedimento_id,
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
            // A API já retorna o procedimento com nome e código
            procedimento: {
              id: item.procedimento.id,
              nome: item.procedimento.nome,
              codigo: item.procedimento.codigo,
              tipo: item.procedimento.tipo || "PROCEDIMENTO",
              especialidade_id: item.procedimento.especialidade_id || 1,
              especialidade: {
                id: item.procedimento.especialidade_id || 1,
                nome: "Especialidade Padrão",
                codigo: "ESP001",
                status: "Ativo",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              },
              status: item.procedimento.status || "Ativo",
              createdAt: item.procedimento.createdAt ? new Date(item.procedimento.createdAt) : new Date(),
              updatedAt: item.procedimento.updatedAt ? new Date(item.procedimento.updatedAt) : new Date(),
              Turma: [],
              Agenda: []
            },
            tabelaFaturamento: {
              id: item.tabela_faturamento_id || 1,
              nome: "Tabela Padrão",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          }));
          
          setProcedimentos(procedimentosMapeados);
        } else {
          setProcedimentos([]);
        }
      } else {
        throw new Error("Erro ao carregar procedimentos");
      }
    } catch (e) {
      console.error("❌ Erro ao carregar procedimentos:", e);
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

  const onSubmit = async (values: z.infer<typeof updateAgendaSchema>) => {
    setLoading(true);

    try {
      if (!unidade?.id || !prestador?.id || !especialidade?.id) {
        toast.error("Unidade, Prestador e Especialidade devem ser selecionados na tela principal antes de agendar.");
        setLoading(false);
        return;
      }
      if (!dataSelecionada || !horaSelecionada) {
        toast.error("Data e horário são obrigatórios para editar o agendamento.");
        setLoading(false);
        return;
      }
      if (!values.cliente_id || !values.convenio_id || !values.procedimento_id) {
        toast.error("Cliente, Convênio e Procedimento são obrigatórios.");
        setLoading(false);
        return;
      }
      if (!tipoClienteSelecionado) {
        toast.error("Tipo de cliente é obrigatório.");
        setLoading(false);
        return;
      }

      // Formatar a data para UTC ISO
      const dataFormatada = localDateToUTCISO(dataSelecionada);
      const dataComHorario = new Date(dataFormatada);
      const [horas, minutos] = horaSelecionada.split(':');
      dataComHorario.setHours(parseInt(horas), parseInt(minutos), 0, 0);

      // Preparar dados para envio
      const dadosParaEnviar = {
        ...values,
        dtagenda: dataComHorario.toISOString(),
        prestador_id: prestador?.id,
        unidade_id: unidade?.id,
        especialidade_id: especialidade?.id,
        situacao: "AGENDADO",
      };

      // Enviar para a API
      if (!agendamentoSelecionado) {
        throw new Error("Agendamento não selecionado");
      }
      
      const response = await fetch(`/api/agendas?id=${agendamentoSelecionado.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dadosParaEnviar),
      });

      if (response.ok) {
        toast.success("Agendamento atualizado com sucesso!");
        setOpen(false);
        carregarAgendamentos();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao atualizar agendamento");
      }
    } catch (error) {
      console.error("❌ Erro ao atualizar agendamento:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar agendamento");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar clientes baseado na pesquisa
  const filteredClientes = clientes.filter(cliente => {
    const searchLower = searchCliente.toLowerCase();
    const nomeLower = cliente.nome.toLowerCase();
    const emailLower = cliente.email?.toLowerCase() || '';
    const cpfLower = cliente.cpf?.toLowerCase() || '';
    
    // Busca mais específica para evitar seleções múltiplas
    if (searchLower.length < 2) return true; // Mostrar todos se busca muito curta
    
    return nomeLower.includes(searchLower) || 
           emailLower.includes(searchLower) || 
           cpfLower.includes(searchLower);
  });

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
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="tipo_cliente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Tipo Cliente *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setTipoClienteSelecionado(value as TipoClienteValorProcedimento);
                          // Limpar procedimento selecionado quando tipo mudar
                          setProcedimentoSelecionado(null);
                          form.setValue("procedimento_id", 0);
                          // Recarregar procedimentos se já há convênio selecionado
                          if (convenioSelecionado) {
                            fetchProcedimentos(value as TipoClienteValorProcedimento, convenioSelecionado.id);
                          }
                        }}
                        value={field.value || tipoClienteSelecionado || undefined}
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
                                {filteredClientes.map((cliente) => (
                                  <CommandItem
                                    value={`${cliente.id}-${cliente.nome}`}
                                    key={`cliente-${cliente.id}-${cliente.nome}`}
                                    onSelect={() => {
                                      console.log("🔍 Cliente selecionado:", cliente.id, cliente.nome);
                                      
                                      // Limpar seleções anteriores
                                      setClienteSelecionado(null);
                                      setConvenioSelecionado(null);
                                      setProcedimentoSelecionado(null);
                                      setConvenios([]);
                                      setProcedimentos([]);
                                      
                                      // Definir novo cliente
                                      field.onChange(cliente.id);
                                      form.setValue("convenio_id", 0);
                                      form.setValue("procedimento_id", 0);
                                      
                                      setClienteSelecionado(cliente);
                                      setTipoClienteSelecionado((cliente.tipoCliente as unknown as TipoClienteValorProcedimento) || null);
                                      form.setValue("tipo_cliente", cliente.tipoCliente || undefined);
                                      
                                      // Buscar convênios do cliente
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

              <div className="space-y-6">
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
