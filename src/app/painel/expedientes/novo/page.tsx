"use client";

//React
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

//Zod
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

//Components
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Breadcrumb from "@/components/ui/Breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

//API

//Types

import { getAlocacaos } from "@/app/api/alocacoes/action";
import { Alocacao } from "@/app/types/Alocacao";
import { createExpediente } from "@/app/api/expediente/action";
import { createExpedienteSchema } from "@/app/api/expediente/schema/formSchemaExpedientes";

export default function NovoExpediente() {
  const [loading, setLoading] = useState(false);
  const [alocacoes, setAlocacoes] = useState<Alocacao[]>([]);

  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(createExpedienteSchema),
    mode: "onChange",
    defaultValues: {
      dtinicio: "",
      dtfinal: "",
      hinicio: "",
      hfinal: "",
      horarioInicio: "",
      horarioFim: "",
      semana: "",
      alocacaoId: 0,
    },
  });

  const fetchAlocacoes = async () => {
    try {
      const { data } = await getAlocacaos();
      setAlocacoes(data);
    } catch (error: any) {
      toast.error("Erro ao carregar dados das alocações");
    }
  };

  useEffect(() => {
    fetchAlocacoes();
  }, []);

  const onSubmit = async (values: z.infer<typeof createExpedienteSchema>) => {
    setLoading(true);
    console.log(values);
    try {
      await createExpediente(values);
      router.push(
        "/painel/expedientes?type=success&message=Salvo com sucesso!"
      );
    } catch (error) {
      toast.error("Erro ao salvar expediente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Expedientes", href: "/painel/expedientes" },
          { label: "Novo Expediente" },
        ]}
      />
      <Form {...form}>
        <h1 className="text-2xl font-bold mb-4 mt-5">Nova Expediente</h1>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto space-y-4 p-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="hinicio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Horário *</FormLabel>
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
                  <FormLabel>Horário *</FormLabel>
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
                  <FormLabel>Data de Fim</FormLabel>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="alocacaoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alocação *</FormLabel>
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
                      {alocacoes.map((alocacao) => {
                        return (
                          <SelectItem
                            key={alocacao.id}
                            value={String(alocacao.id)}
                          >
                            Unidade: {alocacao.unidade.nome}; Especialidade:{" "}
                            {alocacao.especialidade.nome}; Prestador:{" "}
                            {alocacao.prestador.nome};
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage>
                    {form.formState.errors.alocacaoId?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="horarioInicio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Começo do intervalo</FormLabel>
                  <FormControl>
                    <Input {...field} type="time" placeholder="08:00" />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.horarioInicio?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="horarioFim"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fim do intervalo</FormLabel>
                  <FormControl>
                    <Input {...field} type="time" placeholder="08:00" />
                  </FormControl>
                  <FormMessage>
                    {form.formState.errors.horarioFim?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="semana"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dias da semana</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0" disabled>
                        Selecione
                      </SelectItem>
                      <SelectItem value={"Segunda a Sexta"}>
                        Segunda a Sexta
                      </SelectItem>
                      <SelectItem value={"Segunda, Quarta e Sexta"}>
                        Segunda, Quarta e Sexta
                      </SelectItem>
                      <SelectItem value={"Terça e Quinta"}>
                        Terça e Quinta
                      </SelectItem>
                      <SelectItem value={"Todos os dias"}>
                        Todos os dias
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage>
                    {form.formState.errors.semana?.message}
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
