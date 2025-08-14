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
  Form,
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

import { Alocacao } from "@/app/types/Alocacao";
import { Button } from "@/components/ui/button";
import { SaveIcon } from "lucide-react";
import TabelaAlocacoes from "./_components/tabela_alocacoes";
import { createAlocacaoSchema } from "@/app/api/alocacoes/shema/formSchemaAlocacao";
export default function AlocacaoPage() {
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
      prestador_id: 0,
      unidade_id: 0,
      especialidade_id: 0,
    },
  });

  useEffect(() => {
    fetchAlocacoes();
  }, [prestador, unidade, especialidade]);
  const fetchAlocacoes = async () => {
    try {
      setCarregandoDadosAlocacao(true);
      if (!prestador || !unidade) return;
      const params = new URLSearchParams();
      if (prestador) params.append('prestadorId', prestador.id.toString());
      if (especialidade) params.append('especialidade_id', especialidade.id.toString());
      if (unidade) params.append('unidadeId', unidade.id.toString());
      
      const response = await fetch(`/api/alocacoes?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setAlocacoes(data.data);
      } else {
        console.error("Erro ao carregar alocações:", data.error);
      }
    } catch (error) {
      console.error("Erro ao buscar dados de alocações: ", error);
    } finally {
      setCarregandoDadosAlocacao(false);
    }
  };

  const fetchPrestadores = async () => {
    try {
      const response = await fetch("/api/prestadores");
      const data = await response.json();
      
      if (response.ok) {
        setPrestadores(data.data);
      } else {
        console.error("Erro ao carregar prestadores:", data.error);
        toast.error("Erro ao carregar dados dos Prestadores");
      }
    } catch (error: any) {
      console.error("Erro ao carregar prestadores:", error);
      toast.error("Erro ao carregar dados dos Prestadores");
    }
  };
  
  const fetchUnidades = async () => {
    try {
      const response = await fetch("/api/unidades");
      const data = await response.json();
      
      if (response.ok) {
        setUnidades(data.data);
      } else {
        console.error("Erro ao carregar unidades:", data.error);
        toast.error("Erro ao carregar dados das Unidades");
      }
    } catch (error: any) {
      console.error("Erro ao carregar unidades:", error);
      toast.error("Erro ao carregar dados das Unidades");
    }
  };
  
  const fetchEspecialidades = async () => {
    try {
      const response = await fetch("/api/especialidades");
      const data = await response.json();
      
      if (response.ok) {
        setEspecialidades(data.data);
      } else {
        console.error("Erro ao carregar especialidades:", data.error);
        toast.error("Erro ao carregar dados das Especialidades");
      }
    } catch (error: any) {
      console.error("Erro ao carregar especialidades:", error);
      toast.error("Erro ao carregar dados das Especialidades");
    }
  };
  const onSubmit = async (values: z.infer<typeof createAlocacaoSchema>) => {
    try {
      setCarregandoDadosAlocacao(true);
      
      const response = await fetch("/api/alocacoes", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar alocação");
      }

      await fetchAlocacoes();
      toast.success("Alocação criada com sucesso!");
    } catch (error: any) {
      console.error("Erro ao criar alocação:", error);
      toast.error(error.message || "Não foi possível criar a Alocação!");
    } finally {
      setCarregandoDadosAlocacao(false);
    }
  };
  return (
    <div className="container mx-auto">
      <div>
        <Form {...form}>
          <div className="grid grid-cols-3 space-x-3">
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
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
                      <FormControl
                        className={
                          form.formState.errors.prestador_id
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
                      {form.formState.errors.prestador_id?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unidade_id"
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
                          form.formState.errors.unidade_id
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
                      {form.formState.errors.unidade_id?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
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
                      <FormControl
                        className={
                          form.formState.errors.especialidade_id
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
                      {form.formState.errors.especialidade_id?.message}
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
        </Form>
      </div>
    </div>
  );
}
