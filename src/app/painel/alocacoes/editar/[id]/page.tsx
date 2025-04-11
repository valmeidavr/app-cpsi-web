"use client";
//React
import type React from "react";
import { parse, isValid } from "date-fns";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { redirect, useParams, useRouter } from "next/navigation";

//Zod
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
//Components
import Breadcrumb from "@/components/ui/Breadcrumb";
import { Save, Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

//API

//helpers
import {
  createAlocacaoSchema,
  updateAlocacaoSchema,
} from "@/app/api/alocacoes/shema/formSchemaAlocacao";
import {
  createAlocacao,
  getAlocacaoById,
  updateAlocacao,
} from "@/app/api/alocacoes/action";
import { getEspecialidades } from "@/app/api/especialidades/action";
import { Especialidade } from "@/app/types/Especialidade";
import { getPrestadors } from "@/app/api/prestadores/action";
import { Prestador } from "@/app/types/Prestador";
import { getUnidades } from "@/app/api/unidades/action";
import { Unidade } from "@/app/types/Unidades";
import { Alocacao } from "@/app/types/Alocacao";

export default function novaAlocacao() {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [alocacao, setAlocacao] = useState<Alocacao>();
  const router = useRouter();
  const params = useParams();
  const alocacaoId = Array.isArray(params.id) ? params.id[0] : params.id;
  const form = useForm<z.infer<typeof updateAlocacaoSchema>>({
    resolver: zodResolver(updateAlocacaoSchema),
    mode: "onChange",
    defaultValues: {
      unidadesId: 0,
      especialidadesId: 0,
      prestadoresId: 0,
    },
  });

  //Função de submeter os dados
  const fetchEspecialidades = async () => {
    try {
      const { data } = await getEspecialidades();
      console.log("especialidade:", data);
      setEspecialidades(data);
    } catch (error: any) {
      console.error("Não foi possivel buscar as especialidades:", error);
    }
  };

  const fetchPrestadores = async () => {
    try {
      const { data } = await getPrestadors();
      console.log("prestadores:", data);
      setPrestadores(data);
    } catch (error: any) {
      console.error("Não foi possivel buscar as prestadores:", error);
    }
  };

  const fetchUnidades = async () => {
    try {
      const { data } = await getUnidades();
      console.log("unidades:", data);
      setUnidades(data);
    } catch (error: any) {
      console.error("Não foi possivel buscar as unidades:", error);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        if (!alocacaoId) redirect("painel/turmas");
        setLoadingData(true);
        await fetchEspecialidades();
        await fetchPrestadores();
        await fetchUnidades();
        const data = await getAlocacaoById(alocacaoId);
        setAlocacao(data);

        form.reset({
          unidadesId: data.unidadesId,
          especialidadesId: data.especialidadesId,
          prestadoresId: data.prestadoresId,
        });
        setLoadingData(false);
      } catch (error) {
        console.error("Erro ao carregar alocação:", error);
      } finally {
        setLoadingData(false);
      }
    }
    fetchData();
  }, []);

  const onSubmit = async (values: z.infer<typeof updateAlocacaoSchema>) => {
    setLoading(true);
    try {
      if (!alocacaoId) redirect("/painel/alocacoes");
      console.log("Valor:", values)
      await updateAlocacao(alocacaoId.toString(), values);

      const queryParams = new URLSearchParams();

      queryParams.set("type", "success");
      queryParams.set("message", "Alocações atualizado com sucesso!");

      router.push(`/painel/alocacoes?${queryParams.toString()}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col flex-1 h-full">
      {" "}
      {/* overflow-hidden */}
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Alocações", href: "/painel/alocacoes" },
          { label: "Editar Alocação" }, // Último item sem link
        ]}
      />
      {!loadingData ? (
        <Form {...form}>
          <h1 className="text-2xl font-bold mb-4 mt-5">Editar Alocação</h1>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto space-y-4 p-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="unidadesId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
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
                      onValueChange={(value) => field.onChange(Number(value))}
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
              <FormField
                control={form.control}
                name="prestadoresId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prestadores *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
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
                        {prestadores.map((prestadores) => {
                          return (
                            <SelectItem
                              key={prestadores.id}
                              value={String(prestadores.id)}
                            >
                              {prestadores.nome}
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
            </div>

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
                  <Save className="w-4 h-4" />
                  Salvar
                </>
              )}
            </Button>
          </form>
        </Form>
      ) : (
        <div className="h-full w-full flex items-center justify-center mt-5">
          <Loader2 className="w-8 h-8 animate-spin text-primary"></Loader2>
        </div>
      )}
    </div>
  );
}
