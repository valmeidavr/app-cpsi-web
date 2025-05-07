"use client";

//React
import { use, useEffect, useMemo, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
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
import { http } from "@/util/http";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getUnidades } from "@/app/api/unidades/action";
import { getPrestadors } from "@/app/api/prestadores/action";
import { getEspecialidades } from "@/app/api/especialidades/action";
import { Prestador } from "@/app/types/Prestador";
import { Unidade } from "@/app/types/Unidades";
import { Especialidade } from "@/app/types/Especialidade";
import { Expediente } from "@/app/types/Expediente";
import { Button } from "@/components/ui/button";
import { Loader2, Save, SaveIcon } from "lucide-react";
import { createExpedienteSchema } from "@/app/api/expediente/schema/formSchemaExpedientes";
import { createExpediente } from "@/app/api/expediente/action";
import { Input } from "@/components/ui/input";
import { createAlocacaoSchema } from "@/app/api/alocacoes/shema/formSchemaAlocacao";
import { getAlocacaos } from "@/app/api/alocacoes/action";
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

  const [alocacaoId, setAlocacaoId] = useState<number | null>(null);
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
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  const fetchUnidadesByAlocacao = async () => {
    try {
      const { data } = await getAlocacaos();
      const unidadesMap = new Map<number, Unidade>();
      data.forEach((item: Alocacao) => {
        if (!unidadesMap.has(item.unidade.id)) {
          unidadesMap.set(item.unidade.id, item.unidade);
        }
      });
      const listaUnidades: Unidade[] = Array.from(unidadesMap.values());
      setAlocacoes(data);
      setUnidades(listaUnidades);
    } catch (error: any) {
      toast.error("Erro ao carregar dados dos Alocacoes");
    }
  };
  useEffect(() => {
    const fetchPrestadoresByAlocacao = async () => {
      try {
        if (!unidade) return;
        const listaPrestadores: Prestador[] = alocacoes
          .filter((item: Alocacao) => item.unidadesId === unidade.id)
          .map((item: Alocacao) => item.prestador);
        setPrestadores(listaPrestadores);
      } catch (error: any) {
        toast.error("Erro ao carregar dados dos Alocacoes");
      }
    };
    fetchPrestadoresByAlocacao();
  }, [unidade]);

  useEffect(() => {
    const fetchEspecialidadesByPrestadores = async () => {
      try {
        if (!unidade || !prestador) return;
        const listaEspecialidades: Especialidade[] = alocacoes
          .filter((item: Alocacao) => item.unidadesId == unidade.id)
          .map((item: Alocacao) => item.especialidade);
        setEspecialidades(listaEspecialidades);
      } catch (error: any) {
        toast.error("Erro ao carregar dados dos Alocacoes");
      }
    };
    fetchEspecialidadesByPrestadores();
  }, [prestador]);

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
      alocacaoId: 0,
    },
  });
  const formAlocacao = useForm({
    resolver: zodResolver(createAlocacaoSchema),
    mode: "onChange",
    defaultValues: {
      especialidadesId: 0,
      unidadesId: 0,
      prestadoresId: 0,
    },
  });

  useEffect(() => {
    fetchExpedientes();
  }, [prestador, unidade, especialidade]);

  const fetchExpedientes = async () => {
    try {
      setCarregandoDadosExpediente(true);
      if (!unidade || !prestador || !especialidade) return;
      const alocacaoId = alocacoes
        .filter(
          (item: Alocacao) =>
            item.unidadesId == unidade.id &&
            item.prestadoresId == prestador.id &&
            item.especialidadesId == especialidade.id
        )
        .map((item: Alocacao) => item.id);
      setAlocacaoId(alocacaoId[0]);

      form.setValue("alocacaoId", alocacaoId[0]);
      const { data } = await http.get("http://localhost:3000/expedientes", {
        params: {
          limit: 50,
          alocacaoId: alocacaoId[0],
        },
      });
      setExpedientes(data.data);
    } catch (error) {
      console.error("Erro ao buscar dados de alocações: ", error);
    } finally {
      setCarregandoDadosExpediente(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof createExpedienteSchema>) => {
    try {
      setCarregandoDadosExpediente(true);
      if (!alocacaoId)
        throw new Error("Não foi possivel encontrar a Alocação selecionada");
      form.setValue("alocacaoId", alocacaoId);
      await createExpediente(values);
      await fetchExpedientes();
      toast.success("Alocação criada com sucesso!");
    } catch (error: any) {
      toast.error(`Não foi possivel criar a Alocação: ${error.message}`);
    } finally {
      setCarregandoDadosExpediente(false);
    }
  };
  return (
    <div className="container mx-auto">
      <div>
        <div className="grid grid-cols-3 space-x-3">
          <div>
            <FormProvider {...formAlocacao}>
              <form className="space-y-4">
                <FormField
                  name="unidadesId"
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
                  name="prestadoresId"
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
                  name="especialidadesId"
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

                <Button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Button
                        type="submit"
                        variant="default"
                        disabled={loading || !alocacaoId || alocacaoId === 0}
                      >
                        <SaveIcon /> Adicionar
                      </Button>
                    </>
                  )}
                </Button>
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
