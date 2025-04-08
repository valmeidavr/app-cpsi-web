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
import { getTurmaById, updateTurma } from "@/app/api/turmas/action";
import { getPrestadors } from "@/app/api/prestadores/action";
import { getProcedimentos } from "@/app/api/procedimentos/action";
import { createTurmaSchema } from "@/app/api/turmas/schema/formSchemaTurmas";

//Types
import { Turma } from "@/app/types/Turma";
import { Prestador } from "@/app/types/Prestador";
import { Procedimento } from "@/app/types/Procedimento";

export default function EditarTurma() {
  const [turma, setTurma] = useState<Turma | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const params = useParams();
  const turmaId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const router = useRouter();

  //Definindo valores default com os dado do turma
  const form = useForm<z.infer<typeof createTurmaSchema>>({
    resolver: zodResolver(createTurmaSchema),
    mode: "onChange",
    defaultValues: {
      nome: "",
      horarioInicio: "",
      horarioFim: "",
      dataInicio: "",
      dataFim: "",
      limiteVagas: 0,
      prestadoresId: 0,
      procedimentosId: 0,
    },
  });

  const onSubmit = async (values: z.infer<typeof createTurmaSchema>) => {
    setLoading(true);
    console.log(values);
    try {
      if (turmaId) await updateTurma(turmaId, values);

      const queryParams = new URLSearchParams();

      queryParams.set("type", "success");
      queryParams.set("message", "Turma atualizado com sucesso!");

      router.push(`/painel/turmas?${queryParams.toString()}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
    setLoading(false);
  };

  const fetchTurmas = async () => {
    try {
      const { data } = await getPrestadors();
      console.log("Turmas:", data);
      setPrestadores(data);
    } catch (error: any) {
      toast.error("Erro ao carregar dados dos turmas");
    }
  };
  const fetchProcedimentos = async () => {
    try {
      const { data } = await getProcedimentos();
      console.log("Procedimentos:", data);
      setProcedimentos(data);
    } catch (error: any) {
      toast.error("Erro ao carregar dados dos procedimentos");
    }
  };
  useEffect(() => {
    async function fetchData() {
      try {
        setLoadingData(true);
        if (!turmaId) redirect("painel/turmas");
        await fetchTurmas();
        await fetchProcedimentos();
        const data = await getTurmaById(turmaId);
        setTurma(data);
        console.log(data);
        form.reset({
          nome: data.nome,
          horarioInicio: data.horario.split(" - ")[0],
          horarioFim: data.horario.split(" - ")[1],
          dataInicio: data.dataInicio,
          dataFim: data.dataFim,
          limiteVagas: data.limiteVagas,
          prestadoresId: data.prestadoresId,
          procedimentosId: data.procedimentosId,
        });
        setLoadingData(false);
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
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
          { label: "Turmas", href: "/painel/turmas" },
          { label: "Editar Turma" },
        ]}
      />
      {!loadingData ? (
        <Form {...form}>
          <h1 className="text-2xl font-bold mb-4 mt-5">Nova Turma</h1>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto space-y-4 p-2"
          >
            <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        className={
                          form.formState.errors.nome
                            ? "border-red-500"
                            : "border-gray-300"
                        }
                      />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.nome?.message}
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
                    <FormLabel>Horário *</FormLabel>
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
                    <FormLabel>Horário *</FormLabel>
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
                name="dataInicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início *</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.dataInicio?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataFim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Fim</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.dataFim?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="prestadoresId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Turma *</FormLabel>
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
                name="procedimentosId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Procedimento *</FormLabel>
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
                        {procedimentos.map((procedimento) => {
                          return (
                            <SelectItem
                              key={procedimento.id}
                              value={String(procedimento.id)}
                            >
                              {procedimento.nome}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage>
                      {form.formState.errors.procedimentosId?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="limiteVagas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Limite de Vagas *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.limiteVagas?.message}
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
