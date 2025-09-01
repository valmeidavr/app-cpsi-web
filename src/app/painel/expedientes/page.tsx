"use client";

//React
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
//Zod

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
//Components
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
//API

//Helpers
// Removido import http - usando fetch direto
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Prestador } from "@/app/types/Prestador";
import { Unidade } from "@/app/types/Unidades";
import { Especialidade } from "@/app/types/Especialidade";
import { Expediente } from "@/app/types/Expediente";
import { Button } from "@/components/ui/button";
import { Loader2, Save, SaveIcon } from "lucide-react";
import { createExpedienteSchema } from "@/app/api/expediente/schema/formSchemaExpedientes";
import { Input } from "@/components/ui/input";
import { createAlocacaoSchema } from "@/app/api/alocacoes/shema/formSchemaAlocacao";
import { Alocacao } from "@/app/types/Alocacao";
import TabelaExpediente from "./_components/tabela_expedientes";

export default function ExpedientePage() {
  const [loading, setLoading] = useState(false);
  const [carregandoDadosExpediente, setCarregandoDadosExpediente] =
    useState<boolean>(false);

  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [alocacoes, setAlocacoes] = useState<Alocacao[]>([]);

  const [alocacao_id, setAlocacaoId] = useState<number | null>(null);
  const [unidade, setUnidade] = useState<Unidade | null>(null);
  const [prestador, setPrestador] = useState<Prestador | null>(null);
  const [especialidade, setEspecialidade] = useState<Especialidade | null>(
    null
  );
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);

  //Buscando dados estrangerios
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        await Promise.all([fetchUnidadesByAlocacao()]);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast.error("Erro ao carregar dados iniciais");
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  const fetchUnidadesByAlocacao = async () => {
    try {
      const response = await fetch("/api/alocacoes?limit=1000"); // Aumentei o limite
      if (!response.ok) {
        throw new Error("Erro ao carregar alocações");
      }
      const data = await response.json();
      
      console.log("🔍 Debug - Alocações carregadas:", data.data);
      
      // Criar mapa de unidades únicas
      const unidadesMap = new Map<number, Unidade>();
      data.data.forEach((item: Alocacao) => {
        if (item.unidade && !unidadesMap.has(item.unidade.id)) {
          unidadesMap.set(item.unidade.id, item.unidade);
        }
      });
      
      const listaUnidades: Unidade[] = Array.from(unidadesMap.values());
      console.log("🔍 Debug - Unidades encontradas:", listaUnidades);
      
      setAlocacoes(data.data);
      setUnidades(listaUnidades);
    } catch (error) {
      toast.error("Erro ao carregar dados das Alocações");
      console.error("Erro ao carregar alocações:", error);
    }
  };

  // Função para limpar apenas os campos de expediente, mantendo a alocação selecionada
  const limparCamposExpediente = () => {
    // Limpar apenas os campos de input, mantendo a alocação
    form.setValue("dtinicio", "");
    form.setValue("dtfinal", "");
    form.setValue("hinicio", "");
    form.setValue("hfinal", "");
    form.setValue("semana", "");
    form.setValue("intervalo", "");
    
    // NÃO limpar alocacao_id - manter a alocação selecionada
    // form.setValue("alocacao_id", alocacao_id); // Mantém o valor atual
    
    console.log("🧹 Campos de expediente limpos, alocação mantida:", alocacao_id);
  };
  useEffect(() => {
    const fetchPrestadoresByAlocacao = async () => {
      try {
        if (!unidade) return;
        const listaPrestadores: Prestador[] = alocacoes
          .filter((item: Alocacao) => item.unidade_id === unidade.id)
          .map((item: Alocacao) => item.prestador)
          .filter((prestador, index, array) => 
            array.findIndex(p => p.id === prestador.id) === index
          ); // Remove duplicatas
        setPrestadores(listaPrestadores);
        
        // Limpar campos quando mudar unidade
        limparCamposExpediente();
      } catch (error) {
        toast.error("Erro ao carregar dados dos Prestadores");
        console.error("Erro ao carregar prestadores:", error);
      }
    };
    fetchPrestadoresByAlocacao();
  }, [unidade, alocacoes]);

  useEffect(() => {
    const fetchEspecialidadesByPrestadores = async () => {
      try {
        if (!unidade || !prestador) return;
        
        console.log('🔍 Debug - Buscando especialidades para:', {
          unidade: unidade.nome,
          prestador: prestador.nome,
          totalAlocacoes: alocacoes.length
        });
        
        const listaEspecialidades: Especialidade[] = alocacoes
          .filter((item: Alocacao) => 
            item.unidade_id === unidade.id && 
            item.prestador_id === prestador.id
          )
          .map((item: Alocacao) => item.especialidade)
          .filter((especialidade, index, array) => 
            especialidade && especialidade.id && 
            array.findIndex(e => e && e.id === especialidade.id) === index
          ); // Remove duplicatas e valores nulos
        
        console.log('🔍 Debug - Especialidades filtradas:', listaEspecialidades.length);
        
        if (listaEspecialidades.length === 0) {
          console.log('⚠️ Nenhuma especialidade encontrada para os filtros selecionados');
          // Tentar buscar especialidades diretamente como fallback
          try {
            const response = await fetch("/api/especialidades?all=true");
            if (response.ok) {
              const data = await response.json();
              setEspecialidades(data.data || []);
              console.log('🔍 Debug - Especialidades carregadas via fallback:', data.data?.length || 0);
            }
          } catch (fallbackError) {
            console.error('🔍 Debug - Erro no fallback:', fallbackError);
          }
        } else {
          setEspecialidades(listaEspecialidades);
        }
        
        // Limpar campos quando mudar prestador
        limparCamposExpediente();
          } catch (error) {
      console.error("❌ Erro ao carregar especialidades:", error);
      
      // Tentar buscar especialidades diretamente como último recurso
      try {
        const response = await fetch("/api/especialidades?all=true");
        if (response.ok) {
          const data = await response.json();
          setEspecialidades(data.data || []);
          console.log('🔍 Debug - Especialidades carregadas via último recurso:', data.data?.length || 0);
        }
      } catch (lastResortError) {
        console.error('🔍 Debug - Erro no último recurso:', lastResortError);
        toast.error("Erro ao carregar dados das Especialidades");
      }
    }
    };
    fetchEspecialidadesByPrestadores();
  }, [prestador, unidade, alocacoes]);

  //Validação dos campos do formulário
  const form = useForm({
    resolver: zodResolver(createExpedienteSchema),
    mode: "onChange",
    defaultValues: {
      dtinicio: "",
      dtfinal: "",
      hinicio: "",
      hfinal: "",
      semana: "",
      alocacao_id: 0,
    },
  });
  const formAlocacao = useForm({
    resolver: zodResolver(createAlocacaoSchema),
    mode: "onChange",
    defaultValues: {
      especialidade_id: 0,
      unidade_id: 0,
      prestador_id: 0,
    },
  });

  useEffect(() => {
    console.log("🔄 useEffect fetchExpedientes disparado");
    console.log("🔄 Dependências:", { prestador, unidade, especialidade });
    fetchExpedientes();
  }, [prestador, unidade, especialidade]);

  // Limpar campos quando mudar especialidade
  useEffect(() => {
    if (especialidade) {
      limparCamposExpediente();
    }
  }, [especialidade]);

  const fetchExpedientes = async () => {
    try {
      setCarregandoDadosExpediente(true);
      console.log("🔍 fetchExpedientes iniciado");
      console.log("🔍 Unidade:", unidade);
      console.log("🔍 Prestador:", prestador);
      console.log("🔍 Especialidade:", especialidade);
      console.log("🔍 Alocações disponíveis:", alocacoes.length);
      
      if (!unidade || !prestador || !especialidade) {
        console.log("❌ Faltam dados para buscar expedientes");
        console.log("❌ Unidade selecionada:", !!unidade);
        console.log("❌ Prestador selecionado:", !!prestador);
        console.log("❌ Especialidade selecionada:", !!especialidade);
        return;
      }
      
      // Buscar alocação baseada nos filtros selecionados
      console.log("🔍 Procurando alocação com:");
      console.log("🔍 - unidade_id:", unidade.id);
      console.log("🔍 - prestador_id:", prestador.id);
      console.log("🔍 - especialidade_id:", especialidade.id);
      
      const alocacaoEncontrada = alocacoes.find(
        (item: Alocacao) =>
          item.unidade_id === unidade.id &&
          item.prestador_id === prestador.id &&
          item.especialidade_id === especialidade.id
      );

      console.log("🔍 Alocação encontrada:", alocacaoEncontrada);
      console.log("🔍 Todas as alocações:", alocacoes);

      if (!alocacaoEncontrada) {
        console.log("❌ Nenhuma alocação encontrada para os filtros selecionados");
        console.log("❌ Verificando alocações disponíveis:");
        alocacoes.forEach((aloc, index) => {
          console.log(`❌ Alocação ${index}:`, {
            id: aloc.id,
            unidade_id: aloc.unidade_id,
            prestador_id: aloc.prestador_id,
            especialidade_id: aloc.especialidade_id,
            unidade: aloc.unidade,
            prestador: aloc.prestador,
            especialidade: aloc.especialidade
          });
        });
        setExpedientes([]);
        return;
      }

      setAlocacaoId(alocacaoEncontrada.id);
      form.setValue("alocacao_id", alocacaoEncontrada.id);
      console.log("✅ Alocação ID definido:", alocacaoEncontrada.id);

      const params = new URLSearchParams();
      params.append('limit', '50');
      params.append('alocacao_id', alocacaoEncontrada.id.toString());
      
      const url = `/api/expediente?${params}`;
      console.log("🔍 URL da API:", url);
      console.log("🔍 Parâmetros enviados:", {
        limit: '50',
        alocacao_id: alocacaoEncontrada.id.toString()
      });
      
      console.log("🔄 Fazendo requisição para:", url);
      const response = await fetch(url);
      console.log("🔍 Response recebido:", {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });
      
      const data = await response.json();
      console.log("🔍 Response data completo:", data);
      
      if (response.ok) {
        console.log("✅ Dados retornados pela API de expedientes:", data.data);
        console.log("✅ Total de expedientes:", data.data?.length || 0);
        console.log("✅ Paginação:", data.pagination);
        
        if (data.data && Array.isArray(data.data)) {
                setExpedientes(data.data);
      console.log("✅ Expedientes definidos no estado:", data.data.length);
      console.log("✅ Estado atualizado com:", data.data);
        } else {
          console.error("❌ Dados inválidos recebidos:", data.data);
          setExpedientes([]);
        }
      } else {
        console.error("❌ Erro ao carregar expedientes:", data.error);
        console.error("❌ Status da resposta:", response.status);
        setExpedientes([]);
      }
    } catch (error) {
      console.error("❌ Erro ao buscar dados de expedientes: ", error);
      console.error("❌ Stack trace:", error instanceof Error ? error.stack : 'N/A');
      setExpedientes([]);
    } finally {
      setCarregandoDadosExpediente(false);
      console.log("🔍 fetchExpedientes finalizado");
    }
  };

  const onSubmit = async (values: z.infer<typeof createExpedienteSchema>) => {
    try {
      setCarregandoDadosExpediente(true);
      if (!alocacao_id)
        throw new Error("Não foi possível encontrar a Alocação selecionada");
      
      form.setValue("alocacao_id", alocacao_id);
      
      const response = await fetch("/api/expediente", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar expediente");
      }

      const result = await response.json();
      console.log("✅ Resultado da criação:", result);
      
      await fetchExpedientes();
      
      if (result.agendamentosCriados > 0) {
        toast.success(`Expediente criado com sucesso! ${result.agendamentosCriados} agendamentos foram gerados automaticamente.`);
      } else {
        toast.success("Expediente criado com sucesso!");
      }
      
      // Limpar apenas os campos de input, mantendo a alocação selecionada
      limparCamposExpediente();
    } catch (error) {
      toast.error(`Não foi possível criar o Expediente: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setCarregandoDadosExpediente(false);
    }
  };
  // Log para debug do estado
  console.log("🔍 Render - Estado atual:", {
    expedientes: expedientes.length,
    unidade: unidade?.nome,
    prestador: prestador?.nome,
    especialidade: especialidade?.nome,
    alocacao_id,
    carregandoDadosExpediente
  });

  return (
    <div className="container mx-auto">
      <div>
        <div className="grid grid-cols-3 space-x-3">
          <div>
            <FormProvider {...formAlocacao}>
              <form className="space-y-4">
                <FormField
                  name="unidade_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setUnidade(
                            unidades.find((unidade) => unidade.id == +value) ??
                              null
                          );
                        }}
                        value={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0" disabled>
                            Selecione
                          </SelectItem>
                          {unidades.map((unidade) => {
                            return (
                              <SelectItem
                                key={unidade.id}
                                value={String(unidade.id)}
                              >
                                {unidade.nome}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage></FormMessage>
                    </FormItem>
                  )}
                />
                <FormField
                  name="prestador_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prestadores *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setPrestador(
                            prestadores.find(
                              (prestador) => prestador.id == +value
                            ) ?? null
                          );
                        }}
                        value={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0" disabled>
                            Selecione
                          </SelectItem>
                          {prestadores.map((prestador) => {
                            return (
                              <SelectItem
                                key={prestador.id}
                                value={String(prestador.id)}
                              >
                                {prestador.nome}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage></FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  name="especialidade_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especialidade *</FormLabel>
                      <Select
                        disabled={!unidade}
                        onValueChange={(value) => {
                          field.onChange(Number(value));
                          setEspecialidade(
                            especialidades.find(
                              (especialidade) => especialidade.id == +value
                            ) ?? null
                          );
                        }}
                        value={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">Selecione</SelectItem>
                          {especialidades.map((especialidade) => {
                            return (
                              <SelectItem
                                key={especialidade.id}
                                value={String(especialidade.id)}
                              >
                                {especialidade.nome}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage></FormMessage>
                    </FormItem>
                  )}
                />
              </form>
            </FormProvider>
            <FormProvider {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex-1 overflow-y-auto space-y-4 p-2 justify-start"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="hinicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horário Início *</FormLabel>
                        <FormControl>
                          <Input {...field} type="time" placeholder="08:00" />
                        </FormControl>
                        <FormMessage>
                          {form.formState.errors.hinicio?.message}
                        </FormMessage>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="hfinal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horário Fim </FormLabel>
                        <FormControl>
                          <Input {...field} type="time" placeholder="08:00" />
                        </FormControl>
                        <FormMessage>
                          {form.formState.errors.hfinal?.message}
                        </FormMessage>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="dtinicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Início *</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage>
                          {form.formState.errors.dtinicio?.message}
                        </FormMessage>
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
                        <FormMessage>
                          {form.formState.errors.dtfinal?.message}
                        </FormMessage>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="intervalo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Intervalo em minuntos*</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            maxLength={2}
                            placeholder="00"
                          />
                        </FormControl>
                        <FormMessage>
                          {form.formState.errors.intervalo?.message}
                        </FormMessage>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="semana"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dias da semana</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0" disabled>
                            Selecione
                          </SelectItem>
                          <SelectItem value={"Segunda"}>Segunda</SelectItem>
                          <SelectItem value={"Terça"}>Terça</SelectItem>
                          <SelectItem value={"Quarta"}>Quarta</SelectItem>
                          <SelectItem value={"Quinta"}>Quinta</SelectItem>
                          <SelectItem value={"Sexta"}>Sexta</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage>
                        {form.formState.errors.semana?.message}
                      </FormMessage>
                    </FormItem>
                  )}
                />

                                 <div className="flex gap-3">
                   <Button
                     type="submit"
                     disabled={loading}
                     className="flex items-center gap-2"
                     asChild
                   >
                     {loading ? (
                       <span>
                         <Loader2 className="w-4 h-4 animate-spin" />
                         Salvando...
                       </span>
                     ) : (
                       <Button
                         type="submit"
                         variant="default"
                         disabled={loading || !alocacao_id || alocacao_id === 0}
                       >
                         <SaveIcon /> Adicionar
                       </Button>
                     )}
                   </Button>
                 </div>
              </form>
            </FormProvider>
          </div>
          <div className="col-span-2 ">
            <TabelaExpediente
              expedientes={expedientes}
              CarregandoDadosExpediente={carregandoDadosExpediente}
              fetchExpedientes={fetchExpedientes}
              setCarregandoDadosExpediente={setCarregandoDadosExpediente}
              prestador={prestador}
              unidade={unidade}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
