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
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAgenda } from "../AgendaContext";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Cliente, TipoCliente } from "@/app/types/Cliente";
import { localDateToUTCISO } from "@/app/helpers/dateUtils";

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
      cliente_id: 0,
      convenio_id: 0,
      procedimento_id: 0,
      prestador_id: 0,
      unidade_id: 0,
      especialidade_id: 0,
      dtagenda: "",
      tipo: "PROCEDIMENTO",
      tipo_cliente: "NSOCIO", // Usar valor válido do enum
    },
  });

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [procedimentos, setProcedimentos] = useState<ValorProcedimento[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [loading, setLoading] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [horaSelecionada, setHoraSelecionada] = useState<string | null>(null);
  const [openSelectClientes, setOpenSelectClientes] = useState(false);
  const [openSelectProcedimentos, setOpenSelectProcedimentos] = useState(false);
  const [tipoClienteSelecionado, setTipoClienteSelecionada] = useState<TipoCliente | null>(null); // Inicialmente null
  const [convenioSelecionado, setConvenioSelecionada] = useState<Convenio | undefined>(undefined);
  const [procedimentoSelecionado, setProcedimentoSelecionado] = useState<ValorProcedimento | null>(null);
  const [searchCliente, setSearchCliente] = useState("");
  const [searchProcedimento, setSearchProcedimento] = useState("");
  const [openSelectConvenios, setOpenSelectConvenios] = useState(false);
  const [searchConvenio, setSearchConvenio] = useState("");

  useEffect(() => {
    form.reset({
      ...form.getValues(),
      prestador_id: prestador?.id || 0,
      unidade_id: unidade?.id || 0,
      especialidade_id: especialidade?.id || 0,
      dtagenda: dataSelecionada
        ? localDateToUTCISO(dataSelecionada)
        : "",
    });
  }, [prestador, unidade, especialidade, dataSelecionada]);

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
  }, [convenioSelecionado, tipoClienteSelecionado]);

  // Monitorar mudanças no estado para debug
  useEffect(() => {
    console.log("🔍 Estado mudou - clienteSelecionado:", clienteSelecionado?.id, clienteSelecionado?.nome);
  }, [clienteSelecionado]);

  useEffect(() => {
    console.log("🔍 Estado mudou - convenioSelecionado:", convenioSelecionado?.id, convenioSelecionado?.nome);
  }, [convenioSelecionado]);

  useEffect(() => {
    console.log("🔍 Estado mudou - tipoClienteSelecionado:", tipoClienteSelecionado);
  }, [tipoClienteSelecionado]);

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
    console.log("🔍 fetchConvenios chamado para cliente ID:", clienteId);
    
    try {
      const response = await fetch(`/api/convenios-clientes?cliente_id=${clienteId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log("🔍 Convênios recebidos da API:", data);
        
        if (data.data && data.data.length > 0) {
          const conveniosList = data.data.map((item: any) => ({
            id: item.convenioId,
            nome: item.nome,
            regras: item.regras,
            tabela_faturamento_id: item.tabela_faturamentos_id,
            desconto: item.desconto
          })) as Convenio[];

          console.log("🔍 Convênios mapeados:", conveniosList);
          setConvenios(conveniosList);
          setConvenioSelecionada(undefined);
          form.setValue("convenio_id", 0);
          setProcedimentos([]);
          form.setValue("procedimento_id", 0);
          return;
        }
      }
      
      // Fallback: buscar todos os convênios se não houver convênios específicos do cliente
      console.log("🔍 Nenhum convênio específico encontrado, buscando todos");
      const fallbackResponse = await fetch("/api/convenios?limit=1000");
      
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        console.log("🔍 Convênios fallback:", fallbackData.data?.length || 0);
        setConvenios(fallbackData.data || []);
        setConvenioSelecionada(undefined);
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
      setConvenioSelecionada(undefined);
      form.setValue("convenio_id", 0);
      setProcedimentos([]);
      form.setValue("procedimento_id", 0);
    }
  };

  const fetchProcedimentos = async (tipoCliente: TipoCliente, conveniosId: number) => {
    try {
      // Verificar se temos tanto convênio quanto tipo de cliente
      if (!tipoCliente) {
        setProcedimentos([]);
        return;
      }
      
      const response = await fetch(`/api/valor-procedimento?convenio_id=${conveniosId}&tipoCliente=${String(tipoCliente)}`);
      
      if (!response.ok) {
        throw new Error("Erro ao carregar procedimentos");
      }
      
      const data = await response.json();
      
      // A API retorna um array diretamente, não data.data
      if (Array.isArray(data)) {
        // Mapear os dados corretamente baseado na estrutura real retornada
        const procedimentosMapeados = data.map((item: any) => ({
          id: item.id,
          valor: item.valor,
          tipo: item.tipo as any, // Usar o tipo retornado pela API
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
    } catch (e) {
      console.error("❌ Erro ao carregar procedimentos:", e);
      toast.error("Nenhum procedimento encontrado para este convênio/tipo de cliente.");
      setProcedimentos([]); 
    }
  };

  const onSubmit = async (values: any) => {
    setLoading(true);

    try {
      if (!unidade?.id || !prestador?.id || !especialidade?.id) {
        toast.error("Unidade, Prestador e Especialidade devem ser selecionados na tela principal antes de agendar.");
        setLoading(false);
        return;
      }
      if (!dataSelecionada || !values.horario) {
        toast.error("Data e horário são obrigatórios para criar o agendamento.");
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
      const [horas, minutos] = values.horario.split(':');
      dataComHorario.setHours(parseInt(horas), parseInt(minutos), 0, 0);

      // Preparar dados para envio
      const dadosParaEnviar = {
        ...values,
        dtagenda: dataComHorario.toISOString(),
        prestador_id: prestador?.id,
        unidade_id: unidade?.id,
        especialidade_id: especialidade?.id,
        tipo_cliente: tipoClienteSelecionado,
        situacao: "AGENDADO", // Sempre será AGENDADO para novos agendamentos
      };
      delete dadosParaEnviar.horario;

      // Enviar para a API
      const response = await fetch("/api/agendas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dadosParaEnviar),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Agendamento criado com sucesso!");
        setIsOpenModalCreate(false);
        carregarAgendamentos();
        form.reset();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar agendamento");
      }
    } catch (error) {
      console.error("❌ Erro ao criar agendamento:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao criar agendamento");
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

  // Filtrar procedimentos baseado na pesquisa
  const filteredProcedimentos = procedimentos.filter(proc =>
    proc.procedimento.nome.toLowerCase().includes(searchProcedimento.toLowerCase()) ||
    proc.procedimento.codigo?.toLowerCase().includes(searchProcedimento.toLowerCase())
  );

  const filteredConvenios = convenios.filter(convenio =>
    convenio.nome.toLowerCase().includes(searchConvenio.toLowerCase())
  );

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
                  name="tipo_cliente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Tipo Cliente *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setTipoClienteSelecionada(value as TipoCliente);
                          // Limpar procedimento selecionado quando tipo mudar
                          setProcedimentoSelecionado(null);
                          form.setValue("procedimento_id", 0);
                          // Recarregar procedimentos se já há convênio selecionado
                          if (convenioSelecionado) {
                            fetchProcedimentos(value as TipoCliente, convenioSelecionado.id);
                          }
                        }}
                        value={field.value || tipoClienteSelecionado || ""}
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
                      <FormMessage>
                        {form.formState.errors.tipo_cliente?.message}
                      </FormMessage>
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
                                ? clientes.find((item) => +item.id == field.value)?.nome
                                : "Selecione o cliente"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command className="w-[480px] p-0">
                            <CommandInput 
                              placeholder="Busque por nome, CPF ou email..." 
                              value={searchCliente}
                              onValueChange={setSearchCliente}
                            />
                            <CommandList>
                              <CommandEmpty>
                                Nenhum cliente encontrado.
                              </CommandEmpty>
                              <CommandGroup className="w-full p-0">
                                {filteredClientes.map((item) => (
                                  <CommandItem
                                    value={`${item.id}-${item.nome}`}
                                    key={`cliente-${item.id}-${item.nome}`}
                                    onSelect={() => {
                                      console.log("🔍 Cliente selecionado:", item.id, item.nome);
                                      console.log("🔍 Estado ANTES da seleção:", {
                                        clienteSelecionado: clienteSelecionado?.id,
                                        convenioSelecionado: convenioSelecionado?.id,
                                        tipoClienteSelecionado: tipoClienteSelecionado
                                      });
                                      
                                      // Limpar seleções anteriores
                                      setClienteSelecionado(null);
                                      setConvenioSelecionada(undefined);
                                      setTipoClienteSelecionada(null);
                                      setProcedimentoSelecionado(null);
                                      setConvenios([]);
                                      setProcedimentos([]);
                                      
                                      // Definir novo cliente
                                      form.setValue("cliente_id", +item.id);
                                      form.setValue("convenio_id", 0);
                                      form.setValue("procedimento_id", 0);
                                      form.setValue("tipo_cliente", item.tipoCliente || undefined);
                                      
                                      setClienteSelecionado(item);
                                      setTipoClienteSelecionada(item.tipoCliente || null);
                                      
                                      console.log("🔍 Estado DEPOIS da seleção:", {
                                        clienteSelecionado: item.id,
                                        convenioSelecionado: null,
                                        tipoClienteSelecionado: item.tipoCliente
                                      });
                                      
                                      // Buscar convênios do cliente
                                      fetchConvenios(+item.id);
                                      
                                      setOpenSelectClientes(false);
                                      setSearchCliente("");
                                    }}
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium">{item.nome}</span>
                                      {item.cpf && <span className="text-sm text-gray-500">CPF: {item.cpf}</span>}
                                      {item.email && <span className="text-sm text-gray-500">Email: {item.email}</span>}
                                    </div>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                !field.value && "text-muted-foreground",
                                !clienteSelecionado && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              {field.value
                                ? convenios.find((item) => +item.id == field.value)?.nome
                                : clienteSelecionado ? "Selecione convênio" : "Selecione cliente primeiro"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command className="w-[480px] p-0">
                            <CommandInput 
                              placeholder="Busque convênio..." 
                              value={searchConvenio}
                              onValueChange={setSearchConvenio}
                            />
                            <CommandList>
                              <CommandEmpty>
                                Nenhum convênio encontrado.
                              </CommandEmpty>
                              <CommandGroup className="w-full p-0">
                                {filteredConvenios.map((item) => (
                                  <CommandItem
                                    value={item.nome.toString()}
                                    key={item.id}
                                    onSelect={() => {
                                      field.onChange(Number(item.id));
                                      setConvenioSelecionada(item);
                                      setOpenSelectConvenios(false);
                                      setSearchConvenio("");
                                    }}
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium">{item.nome}</span>
                                      {item.regras && <span className="text-sm text-gray-500">{item.regras}</span>}
                                    </div>
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
                        {form.formState.errors.convenio_id?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />

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
                                !field.value && "text-muted-foreground",
                                (!convenioSelecionado || !tipoClienteSelecionado) && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              {(() => {
                                if (field.value) {
                                  const selectedItem = procedimentos.find(
                                    (p) => p.procedimento.id == field.value
                                  );
                                  if (selectedItem) {
                                    return `${selectedItem.procedimento.nome} - R$${Number(selectedItem.valor).toFixed(2)}`;
                                  }
                                } else {
                                  if (!convenioSelecionado) {
                                    return "Selecione convênio primeiro";
                                  } else if (!tipoClienteSelecionado) {
                                    return "Selecione tipo de cliente primeiro";
                                  } else {
                                    return "Selecione procedimento";
                                  }
                                }
                              })()}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command className="w-[480px] p-0">
                            <CommandInput 
                              placeholder="Busque procedimento..." 
                              value={searchProcedimento}
                              onValueChange={setSearchProcedimento}
                            />
                            <CommandList>
                              <CommandEmpty>
                                Nenhum procedimento encontrado.
                              </CommandEmpty>
                              <CommandGroup className="w-full p-0">
                                {filteredProcedimentos.map((item) => (
                                  <CommandItem
                                    value={item.procedimento.nome}
                                    key={`${item.id}-${item.procedimento.id}`}
                                    className="flex items-center justify-between"
                                    onSelect={() => {
                                      form.setValue("procedimento_id", item.procedimento.id);
                                      setProcedimentoSelecionado(item);
                                      setOpenSelectProcedimentos(false);
                                      setSearchProcedimento("");
                                    }}
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium">{item.procedimento.nome}</span>
                                      {item.procedimento.codigo && (
                                        <span className="text-sm text-gray-500">Código: {item.procedimento.codigo}</span>
                                      )}
                                    </div>
                                    <span className="mx-4 font-semibold text-green-600">
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

                <FormField
                  control={form.control}
                  name="horario"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Horário *</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          className="h-11 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors"
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                        />
                      </FormControl>
                      <FormMessage>
                        {form.formState.errors.horario?.message}
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
