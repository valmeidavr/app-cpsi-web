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
import {
  createAlocacao,
} from "@/app/api/alocacoes/action";
import { Alocacao } from "@/app/types/Alocacao";
import { Button } from "@/components/ui/button";
import { SaveIcon } from "lucide-react";
import TabelaAlocacoes from "./_components/tabela_alocacoes";
import { createAlocacaoSchema } from "@/app/api/alocacoes/shema/formSchemaAlocacao";
export default function Agendas() {
  const [carregando, setCarregando] = useState(false);
  const [carregandoDadosAlocacao, setCarregandoDadosAlocacao] =
    useState<boolean>(false);
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);

  const [unidade, setUnidade] = useState<Unidade | null>(null);
  const [prestador, setPrestador] = useState<Prestador | null>(null);
  const [especialidade, setEspecialidade] = useState<Especialidade | null>(
    null
  );
  const [alocacoes, setAlocacoes] = useState<Alocacao[]>([]);

  //Buscando dados estrangerios
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregando(true);
        await Promise.all([
          fetchEspecialidades(),
          fetchPrestadores(),
          fetchUnidades(),
        ]);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, []);

  //Validação dos campos do formulário
  const form = useForm({
    resolver: zodResolver(createAlocacaoSchema),
    mode: "onChange",
    defaultValues: {
      prestadoresId: 0,
      unidadesId: 0,
      especialidadesId: 0,
    },
  });

  useEffect(() => {
    fetchAlocacoes();
  }, [prestador, unidade, especialidade]);
  const fetchAlocacoes = async () => {
    try {
      setCarregandoDadosAlocacao;
      true;
      if (!prestador || !unidade) return;
      const { data } = await http.get("http://localhost:3000/alocacoes", {
        params: {
          prestadorId: prestador ? prestador.id : null,
          especialidadeId: especialidade ? especialidade.id : null,
          unidadeId: unidade ? unidade.id : null,
        },
      });
      setAlocacoes(data.data);
    } catch (error) {
      console.error("Erro ao buscar dados de alocações: ", error);
    } finally {
      setCarregandoDadosAlocacao(false);
    }
  };

  const fetchPrestadores = async () => {
    try {
      const { data } = await getPrestadors();
      setPrestadores(data);
    } catch (error: any) {
      toast.error("Erro ao carregar dados dos Prestadores");
    }
  };
  const fetchUnidades = async () => {
    try {
      const { data } = await getUnidades();
      setUnidades(data);
    } catch (error: any) {
      toast.error("Erro ao carregar dados dos Unidades");
    }
  };
  const fetchEspecialidades = async () => {
    try {
      const { data } = await getEspecialidades();
      setEspecialidades(data);
    } catch (error: any) {
      toast.error("Erro ao carregar dados dos Especialidades");
    }
  };
  const onSubmit = async (values: z.infer<typeof createAlocacaoSchema>) => {
    try {
      setCarregandoDadosAlocacao(true);
      await createAlocacao(values);
      await fetchAlocacoes();
      toast.success("Alocação criada com sucesso!");
    } catch (error) {
      toast.error("Não foi possivel criar a Alocação!");
    } finally {
      setCarregandoDadosAlocacao(false);
    }
  };
  return (
    <div className="container mx-auto">
      <div>
        <FormProvider {...form}>
          <div className="grid grid-cols-3 space-x-3">
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
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
                      <FormControl
                        className={
                          form.formState.errors.prestadoresId
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
                    <FormMessage>
                      {form.formState.errors.prestadoresId?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unidadesId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade *</FormLabel>
                    <Select
                      disabled={!prestador}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setUnidade(
                          unidades.find((unidade) => unidade.id == +value) ??
                            null
                        );
                      }}
                      value={String(field.value)}
                    >
                      <FormControl
                        className={
                          form.formState.errors.unidadesId
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
                    <FormMessage>
                      {form.formState.errors.unidadesId?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
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
                      <FormControl
                        className={
                          form.formState.errors.especialidadesId
                            ? "border-red-500"
                            : "border-gray-300"
                        }
                      >
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
                    <FormMessage>
                      {form.formState.errors.especialidadesId?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <Button type="submit" variant="default">
                <SaveIcon /> Adicionar
              </Button>
            </form>
            <div className="col-span-2 ">
              <TabelaAlocacoes
                alocacoes={alocacoes}
                CarregandoDadosAlocacao={carregandoDadosAlocacao}
                fetchAlocacoes={fetchAlocacoes}
                setCarregandoDadosAlocacao={setCarregandoDadosAlocacao}
                prestador={prestador}
                unidade={unidade}
              />
            </div>
          </div>
        </FormProvider>
      </div>
    </div>
  );
}
