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
  setAgendamentoSelecionado: (agendamento: any) => void;
  horaSelecionada: string | null;
  dataSelecionada: Date | null;
}
const ModalAgendamento = ({
  open,
  setOpen,
  agendamentoSelecionado,
  setAgendamentoSelecionado,
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
    },
  });
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [procedimentos, setProcedimentos] = useState<ValorProcedimento[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [clientesCarregados, setClientesCarregados] = useState(false);
  const [loadingConvenios, setLoadingConvenios] = useState(false);
  const [loadingProcedimentos, setLoadingProcedimentos] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(
    null
  );
  const [convenioSelecionado, setConvenioSelecionado] = useState<Convenio | null>(
    null
  );
  const [procedimentoSelecionado, setProcedimentoSelecionado] = useState<ValorProcedimento | null>(
    null
  );
  const [openSelectClientes, setOpenSelectClientes] = useState(false);
  const [openSelectProcedimentos, setOpenSelectProcedimentos] = useState(false);
  const [openSelectConvenios, setOpenSelectConvenios] = useState(false);
  const [searchCliente, setSearchCliente] = useState("");
  const [searchProcedimento, setSearchProcedimento] = useState("");
  const [searchConvenio, setSearchConvenio] = useState("");
  useEffect(() => {
    if (open && !clientesCarregados) {
      fetchClientes();
    }
  }, [open, clientesCarregados]);
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
  // useEffect para gerenciar abertura do modal - funciona para os 2 cenários
  useEffect(() => {
    if (open) {
      console.log('🚀 [MODAL EDIT] Modal aberto - Cenário:', agendamentoSelecionado ? 'EDITAR' : 'CRIAR');
      
      if (agendamentoSelecionado && clientes.length > 0) {
        // CENÁRIO 2: Editar agendamento existente (AGENDADO)
        console.log('📝 [MODAL EDIT] Preenchendo dados do agendamento existente:', agendamentoSelecionado);
        
        // Setar valores no formulário
        form.setValue("cliente_id", agendamentoSelecionado.cliente_id);
        form.setValue("convenio_id", agendamentoSelecionado.convenio_id);
        form.setValue("procedimento_id", agendamentoSelecionado.procedimento_id);
        form.setValue("dtagenda", agendamentoSelecionado.dtagenda);
        
        // Buscar e definir cliente
        const clienteEncontrado = clientes.find(c => c.id === agendamentoSelecionado.cliente_id);
        if (clienteEncontrado) {
          console.log('👤 [MODAL EDIT] Cliente encontrado:', clienteEncontrado.nome);
          setClienteSelecionado(clienteEncontrado);
          
          // Carregar convênios para este cliente
          fetchConvenios(clienteEncontrado.id);
        } else {
          console.log('❌ [MODAL EDIT] Cliente não encontrado com ID:', agendamentoSelecionado.cliente_id);
        }
      } else {
        // CENÁRIO 1: Criar novo agendamento (LIVRE → AGENDADO)
        console.log('🆕 [MODAL EDIT] Limpando campos para novo agendamento');
        
        // Limpar todos os estados
        setClienteSelecionado(null);
        setConvenioSelecionado(null);
        setProcedimentoSelecionado(null);
        setConvenios([]);
        setProcedimentos([]);
        
        // Reset form para novo agendamento
        form.reset({
          cliente_id: 0,
          convenio_id: 0,
          procedimento_id: 0,
          prestador_id: prestador?.id || 0,
          unidade_id: unidade?.id || 0,
          especialidade_id: especialidade?.id || 0,
          dtagenda: dataSelecionada ? localDateToUTCISO(dataSelecionada, horaSelecionada || "00:00") : "",
          horario: horaSelecionada || "",
          tipo: "PROCEDIMENTO",
        });
      }
    }
  }, [open, agendamentoSelecionado, clientes, dataSelecionada, horaSelecionada]);

  // useEffect separado para definir convênio e procedimento quando as listas estiverem disponíveis
  useEffect(() => {
    if (open && agendamentoSelecionado && convenios.length > 0) {
      // Buscar dados do convênio
      const convenioEncontrado = convenios.find(c => c.id === agendamentoSelecionado.convenio_id);
      if (convenioEncontrado) {
        console.log('🏥 [MODAL EDIT] Convênio encontrado:', convenioEncontrado.nome);
        setConvenioSelecionado(convenioEncontrado);
      }
    }
  }, [open, agendamentoSelecionado, convenios]);

  // useEffect separado para definir procedimento quando a lista estiver disponível
  useEffect(() => {
    if (open && agendamentoSelecionado && procedimentos.length > 0) {
      // Buscar dados do procedimento
      const procedimentoEncontrado = procedimentos.find(p => p.procedimento.id === agendamentoSelecionado.procedimento_id);
      if (procedimentoEncontrado) {
        console.log('💊 [MODAL EDIT] Procedimento encontrado:', procedimentoEncontrado.procedimento.nome);
        setProcedimentoSelecionado(procedimentoEncontrado);
      }
    }
  }, [open, agendamentoSelecionado, procedimentos]);

  useEffect(() => {
    console.log('🎯 [MODAL EDIT] useEffect para procedimentos executado:', {
      convenioSelecionado: convenioSelecionado?.nome,
      convenioId: convenioSelecionado?.id,
      clienteSelecionado: clienteSelecionado?.nome,
      clienteTipoCliente: clienteSelecionado?.tipoCliente,
      ambosPresentes: !!(convenioSelecionado && clienteSelecionado)
    });
    
    if (convenioSelecionado && clienteSelecionado) {
      const tipoCliente = clienteSelecionado.tipoCliente as TipoClienteValorProcedimento;
      console.log('🚀 [MODAL EDIT] Chamando fetchProcedimentos com:', {
        tipoCliente,
        convenioId: convenioSelecionado.id
      });
      fetchProcedimentos(tipoCliente, convenioSelecionado.id);
    } else {
      console.log('❌ [MODAL EDIT] Condições não atendidas para buscar procedimentos');
      setProcedimentos([]);
      form.setValue("procedimento_id", 0);
    }
  }, [convenioSelecionado, clienteSelecionado]);
  const fetchClientes = async () => {
    try {
      setLoadingClientes(true);
      const response = await fetch("/api/clientes");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro ao carregar clientes: ${response.status} - ${errorData.error || 'Erro desconhecido'}`);
      }
      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        console.log('👥 [MODAL EDIT] Clientes carregados (primeiros 3):', data.data.slice(0, 3).map((c: Cliente) => ({
          nome: c.nome,
          id: c.id,
          tipoCliente: c.tipoCliente
        })));
        setClientes(data.data);
        setClientesCarregados(true);
      } else {
        setClientes([]);
      }
    } catch (error) {
      toast.error("Erro ao carregar clientes");
      setClientes([]);
    } finally {
      setLoadingClientes(false);
    }
  };
  const fetchConvenios = async (clienteId: number) => {
    if (!clienteId) return;
    try {
      setLoadingConvenios(true);
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
      toast.error("Erro ao carregar convênios para este cliente.");
      setConvenios([]);
      setConvenioSelecionado(null);
      form.setValue("convenio_id", 0);
      setProcedimentos([]);
      form.setValue("procedimento_id", 0);
    } finally {
      setLoadingConvenios(false);
    }
  };
  const fetchProcedimentos = async (
    tipoCliente: TipoClienteValorProcedimento,
    convenio_id: number
  ) => {
    try {
      setLoadingProcedimentos(true);
      console.log('🔍 [MODAL EDIT] fetchProcedimentos chamado com:', {
        tipoCliente,
        convenio_id,
        clienteSelecionado: clienteSelecionado?.nome,
        convenioSelecionado: convenioSelecionado?.nome
      });
      
      if (!tipoCliente) {
        console.log('⚠️ [MODAL EDIT] tipoCliente não informado, limpando procedimentos');
        setProcedimentos([]);
        return;
      }
      
      const url = `/api/valor-procedimento?convenio_id=${convenio_id}&tipoCliente=${String(tipoCliente)}`;
      console.log('🌐 [MODAL EDIT] URL da requisição:', url);
      
      const response = await fetch(url);
      console.log('📡 [MODAL EDIT] Status da resposta:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📄 [MODAL EDIT] Dados recebidos:', data);
        console.log('📊 [MODAL EDIT] Tipo dos dados:', Array.isArray(data) ? 'Array' : typeof data);
        console.log('📈 [MODAL EDIT] Quantidade de itens:', Array.isArray(data) ? data.length : 'N/A');
        
        if (Array.isArray(data)) {
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
          
          console.log('🔄 [MODAL EDIT] Procedimentos mapeados (antes dedup):', procedimentosMapeados.length);
          console.log('📝 [MODAL EDIT] Primeiros 3 procedimentos:', procedimentosMapeados.slice(0, 3).map(p => ({
            nome: p.procedimento.nome,
            valor: p.valor,
            id: p.id
          })));
          
          // Remover duplicados baseado no nome do procedimento, mantendo apenas o primeiro
          const procedimentosUnicos = procedimentosMapeados.filter((procedimento, index) => {
            return procedimentosMapeados.findIndex(p => 
              p.procedimento.nome.toLowerCase() === procedimento.procedimento.nome.toLowerCase()
            ) === index;
          });
          
          console.log('✅ [MODAL EDIT] Procedimentos únicos (após dedup):', procedimentosUnicos.length);
          console.log('📋 [MODAL EDIT] Lista final:', procedimentosUnicos.map(p => p.procedimento.nome));
          
          setProcedimentos(procedimentosUnicos);
        } else {
          console.log('⚠️ [MODAL EDIT] Dados não são array, setando procedimentos vazios');
          setProcedimentos([]);
        }
      } else {
        console.error('❌ [MODAL EDIT] Resposta não OK:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ [MODAL EDIT] Conteúdo do erro:', errorText);
        throw new Error("Erro ao carregar procedimentos");
      }
    } catch (e) {
      console.error('💥 [MODAL EDIT] Exceção ao buscar procedimentos:', e);
      toast.error("Nenhum procedimento encontrado");
      setProcedimentos([]);
    } finally {
      setLoadingProcedimentos(false);
    }
  };
  useEffect(() => {
    if (dataSelecionada && horaSelecionada) {
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
      // Usar diretamente a função corrigida com data e hora
      const dataComHorarioISO = localDateToUTCISO(dataSelecionada, horaSelecionada);
      const dadosParaEnviar = {
        ...values,
        dtagenda: dataComHorarioISO,
        prestador_id: prestador?.id,
        unidade_id: unidade?.id,
        especialidade_id: especialidade?.id,
        situacao: "AGENDADO",
      };
      
      console.log('📤 [MODAL EDIT] Dados enviados para API:', dadosParaEnviar);
      console.log('🆔 [MODAL EDIT] ID do agendamento:', agendamentoSelecionado?.id);
      console.log('🎯 [MODAL EDIT] Cenário detectado:', agendamentoSelecionado ? 'EDITAR' : 'CRIAR');
      
      let response;
      if (agendamentoSelecionado) {
        // CENÁRIO 2: Editar agendamento existente (PUT)
        response = await fetch(`/api/agendas?id=${agendamentoSelecionado.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dadosParaEnviar),
        });
      } else {
        // CENÁRIO 1: Criar novo agendamento (POST)
        response = await fetch("/api/agendas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dadosParaEnviar),
        });
      }
      
      if (response.ok) {
        toast.success(agendamentoSelecionado ? "Agendamento atualizado com sucesso!" : "Agendamento criado com sucesso!");
        
        // Limpar campos e estados
        form.reset({
          cliente_id: 0,
          convenio_id: 0,
          procedimento_id: 0,
          prestador_id: prestador?.id ?? 0,
          unidade_id: unidade?.id ?? 0,
          especialidade_id: especialidade?.id ?? 0,
          dtagenda: "",
          horario: "",
          tipo: "PROCEDIMENTO",
        });
        setClienteSelecionado(null);
        setConvenioSelecionado(null);
        setProcedimentoSelecionado(null);
        setConvenios([]);
        setProcedimentos([]);
        setAgendamentoSelecionado(null);
        setOpen(false);
        carregarAgendamentos();
      } else {
        const errorData = await response.json();
        console.error('🚨 [MODAL EDIT] Erro da API:', errorData);
        
        // Mostrar detalhes específicos do erro
        let errorMessage = errorData.error || "Erro ao atualizar agendamento";
        
        if (errorData.details) {
          console.error('🔍 [MODAL EDIT] Detalhes do erro:', errorData.details);
          
          // Se é erro de validação, mostrar campos específicos
          if (errorData.type === 'validation_error' && errorData.details.fieldErrors) {
            const fieldErrors = Object.entries(errorData.details.fieldErrors)
              .map(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`)
              .join(' | ');
            errorMessage += ` - Campos inválidos: ${fieldErrors}`;
          }
          
          // Se é erro SQL, mostrar código
          if (errorData.details.sqlCode) {
            errorMessage += ` - Código SQL: ${errorData.details.sqlCode}`;
          }
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('💥 [MODAL EDIT] Erro no catch:', error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao atualizar agendamento";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  const filteredClientes = clientes.filter(cliente => {
    const searchLower = searchCliente.toLowerCase();
    const nomeLower = cliente.nome.toLowerCase();
    const emailLower = cliente.email?.toLowerCase() || '';
    const cpfLower = cliente.cpf?.toLowerCase() || '';
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
            {agendamentoSelecionado ? 'Editar Agendamento' : 'Criar Agendamento'}
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            {agendamentoSelecionado 
              ? 'Atualize as informações do agendamento selecionado'
              : 'Preencha as informações para criar um novo agendamento'
            }
          </p>
        </DialogHeader>
        <Form {...form}>
          <div className="flex flex-col">
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="space-y-6">
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
                              disabled={loadingClientes}
                              className={cn(
                                "w-full justify-between h-11 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors",
                                !field.value && "text-muted-foreground",
                                loadingClientes && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              {loadingClientes ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Carregando clientes...
                                </>
                              ) : (() => {
                                console.log('🔍 [MODAL EDIT] Renderizando botão cliente:', clienteSelecionado?.nome);
                                return clienteSelecionado?.nome || "Selecione o cliente";
                              })()}
                              {!loadingClientes && <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
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
                                      console.log('👤 [MODAL EDIT] Cliente selecionado:', cliente);
                                      // Limpar seleções dependentes (mas não o cliente)
                                      setConvenioSelecionado(null);
                                      setProcedimentoSelecionado(null);
                                      setConvenios([]);
                                      setProcedimentos([]);
                                      
                                      // Definir valores no form
                                      field.onChange(cliente.id);
                                      form.setValue("convenio_id", 0);
                                      form.setValue("procedimento_id", 0);
                                      
                                      // Definir cliente selecionado
                                      setClienteSelecionado(cliente);
                                      console.log('✅ [MODAL EDIT] Cliente definido:', cliente.nome);
                                      
                                      // Carregar convênios
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
                              disabled={!clienteSelecionado || loadingConvenios}
                              className={cn(
                                "w-full justify-between h-11 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors",
                                !field.value && "text-muted-foreground",
                                (!clienteSelecionado || loadingConvenios) && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              {loadingConvenios ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Carregando convênios...
                                </>
                              ) : field.value ? (
                                convenios.find((convenio) => convenio.id === field.value)?.nome
                              ) : (
                                "Selecione o convênio"
                              )}
                              {!loadingConvenios && <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
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
                              disabled={!convenioSelecionado || !clienteSelecionado || loadingProcedimentos}
                              className={cn(
                                "w-full justify-between h-11 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors",
                                !field.value && "text-muted-foreground",
                                (!convenioSelecionado || !clienteSelecionado || loadingProcedimentos) && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              {loadingProcedimentos ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Carregando procedimentos...
                                </>
                              ) : (
                                <>
                                  {field.value
                                    ? procedimentos.find((proc) => proc.procedimento.id === field.value)?.procedimento.nome
                                    : !convenioSelecionado 
                                      ? "Selecione o convênio primeiro" 
                                      : !clienteSelecionado 
                                        ? "Selecione o cliente primeiro"
                                        : "Selecione o procedimento"}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </>
                              )}
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
                                      <div className="flex-1 flex justify-between items-center">
                                        <div className="flex flex-col">
                                          <span className="font-medium">{proc.procedimento.nome}</span>
                                          {proc.procedimento.codigo && (
                                            <span className="text-xs text-gray-500">
                                              Código: {proc.procedimento.codigo}
                                            </span>
                                          )}
                                        </div>
                                        <span className="mx-4 font-semibold text-green-600">
                                          R${Number(proc.valor).toFixed(2)}
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
                    agendamentoSelecionado ? "Salvar Alterações" : "Criar Agendamento"
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