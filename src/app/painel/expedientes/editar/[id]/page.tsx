"use client";
//react
import { useEffect, useState } from "react";
import { redirect, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
//Components
import Breadcrumb from "@/components/ui/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
//Zod
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
//API

//Types
import { Expediente } from "@/app/types/Expediente";
import { Prestador } from "@/app/types/Prestador";
import { Procedimento } from "@/app/types/Procedimento";
import { Alocacao } from "@/app/types/Alocacao";
import {
  getExpedienteById,
  updateExpediente,
} from "@/app/api/expediente/action";
import { getAlocacaos } from "@/app/api/alocacoes/action";
import { createExpedienteSchema } from "@/app/api/expediente/schema/formSchemaExpedientes";
import { formatDate } from "date-fns";

export default function EditarExpediente() {
  const [expediente, setExpediente] = useState<Expediente | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const params = useParams();
  const expedienteId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [alocacoes, setAlocacoes] = useState<Alocacao[]>([]);
  const router = useRouter();

  //Definindo valores default com os dado do expediente
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

  const onSubmit = async (values: z.infer<typeof createExpedienteSchema>) => {
    setLoading(true);

    try {
      if (expedienteId) await updateExpediente(expedienteId, values);

      const queryParams = new URLSearchParams();

      queryParams.set("type", "success");
      queryParams.set("message", "Expediente atualizado com sucesso!");

      router.push(`/painel/expedientes?${queryParams.toString()}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
    setLoading(false);
  };

  const fetchAlocacoes = async () => {
    try {
      const { data } = await getAlocacaos();
      setAlocacoes(data);
    } catch (error: any) {
      toast.error("Erro ao carregar dados das alocações");
    }
  };
  useEffect(() => {
    async function fetchData() {
      try {
        setLoadingData(true);
        if (!expedienteId) redirect("painel/expedientes");
        await fetchAlocacoes();
        const data = await getExpedienteById(expedienteId);
        console.log(data);
        setExpediente(data);

        form.reset({
          dtinicio: formatDate(new Date(data.dtinicio), "yyyy-MM-dd"),
          dtfinal: formatDate(new Date(data.dtfinal), "yyyy-MM-dd"),
          hinicio: data.hinicio,
          hfinal: data.hfinal,
          horarioInicio: data.intervalo.split(" - ")[0],
          horarioFim: data.intervalo.split(" - ")[1],
          semana: data.semana,
          alocacaoId: data.alocacaoId,
        });
        setLoadingData(false);
      } catch (error) {
        console.error("Erro ao carregar expediente:", error);
      } finally {
        setLoadingData(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="flex flex-col flex-1 h-full">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Expedientes", href: "/painel/expedientes" },
          { label: "Editar Expediente" },
        ]}
      />
      {!loadingData ? (
        <Form {...form}>
          <h1 className="text-2xl font-bold mb-4 mt-5">Editar Expediente</h1>
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
                name="horarioInicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Começo do intervalo *</FormLabel>
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
                    <FormLabel>Fim do intervalo *</FormLabel>
                    <FormControl>
                      <Input {...field} type="time" placeholder="08:00" />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.horarioFim?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

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
                              Prestador: {alocacao.prestador.nome}
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
