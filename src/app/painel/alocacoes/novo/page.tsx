"use client";
//React
import type React from "react";
import { parse, isValid } from "date-fns";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

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
import { createAlocacaoSchema } from "@/app/api/alocacoes/shema/formSchemaAlocacao";
import { createAlocacao } from "@/app/api/alocacoes/action";
import { getEspecialidades } from "@/app/api/especialidades/action";
import { Especialidade } from "@/app/types/Especialidade";
import { getPrestadors } from "@/app/api/prestadores/action";
import { Prestador } from "@/app/types/Prestador";
import { getUnidades } from "@/app/api/unidades/action";
import { Unidade } from "@/app/types/Unidades";

export default function novaAlocacao() {
  const [loading, setLoading] = useState(false);
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const router = useRouter();

  const form = useForm<z.infer<typeof createAlocacaoSchema>>({
    resolver: zodResolver(createAlocacaoSchema),
    mode: "onChange",
    defaultValues: {
      unidadesId: 0,
      especialidadesId: 0,
      prestadoresId: 0,
    },
  });

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
    try {
      setLoading(true);
      fetchEspecialidades();
      fetchPrestadores();
      fetchUnidades();
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, []);
  const onSubmit = async (values: z.infer<typeof createAlocacaoSchema>) => {
    setLoading(true);
    try {
      await createAlocacao(values);

      const currentUrl = new URL(window.location.href);
      const queryParams = new URLSearchParams(currentUrl.search);

      queryParams.set("type", "success");
      queryParams.set("message", "Alocacao salvo com sucesso!");

      router.push(`/painel/alocacoes?${queryParams.toString()}`);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Erro ao salvar alocacao";

      // Exibindo toast de erro
      toast.error(errorMessage);
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
          { label: "Novo Alocação" }, // Último item sem link
        ]}
      />
      <Form {...form}>
        <h1 className="text-2xl font-bold mb-4 mt-5">Nova Alocação</h1>
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
    </div>
  );
}
