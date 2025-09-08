"use client";
import { useEffect, useState } from "react";
import { redirect, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
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
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createTurmaSchema } from "@/app/api/turmas/schema/formSchemaTurmas";
import { Turma } from "@/app/types/Turma";
import { Prestador } from "@/app/types/Prestador";
import { Procedimento } from "@/app/types/Procedimento";
export default function EditarTurma() {
  const [turma, setTurma] = useState<Turma | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const params = useParams();
  const turmaId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const router = useRouter();
  const form = useForm<z.infer<typeof createTurmaSchema>>({
    resolver: zodResolver(createTurmaSchema),
    mode: "onChange",
    defaultValues: {
      nome: "",
      horario_inicio: "",
      horario_fim: "",
      data_inicio: "",
      limite_vagas: 0,
      prestador_id: 0,
      procedimento_id: 0,
    },
  });
  const onSubmit = async (values: z.infer<typeof createTurmaSchema>) => {
    setLoading(true);
    try {
      if (!turmaId) throw new Error("ID da turma não encontrado.");
      const response = await fetch(`/api/turmas/${turmaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: values.nome,
          horario_inicio: values.horario_inicio,
                      horario_fim: values.horario_fim,
                      data_inicio: values.data_inicio,
                      limite_vagas: values.limite_vagas,
                  prestador_id: values.prestador_id,
        procedimento_id: values.procedimento_id
        }),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || "Erro ao atualizar turma.");
      }
      const queryParams = new URLSearchParams();
      queryParams.set("type", "success");
      queryParams.set("message", "Turma atualizada com sucesso!");
      router.push(`/painel/turmas?${queryParams.toString()}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar turma");
    } finally {
      setLoading(false);
    }
  };
  const fetchPrestadores = async () => {
    try {
      const response = await fetch("/api/prestadores");
      const data = await response.json();
      if (response.ok) {
        setPrestadores(data.data);
      } else {
      }
    } catch (error) {
      toast.error("Erro ao carregar dados dos prestadores");
    }
  };
  const fetchProcedimentos = async () => {
    try {
      const response = await fetch("/api/procedimentos");
      const data = await response.json();
      if (response.ok) {
        setProcedimentos(data.data);
      } else {
      }
    } catch (error) {
      toast.error("Erro ao carregar dados dos procedimentos");
    }
  };
  useEffect(() => {
    setCarregando(true);
    async function fetchData() {
      try {
        if (!turmaId) redirect("/painel/turmas");
        await fetchPrestadores();
        await fetchProcedimentos();
        const response = await fetch(`/api/turmas/${turmaId}`);
        const data = await response.json();
        if (response.ok) {
          setTurma(data);
          form.reset({
            nome: data.nome,
            horario_inicio: data.horario_inicio,
                          horario_fim: data.horario_fim,
                          data_inicio: data.data_inicio,
                          limite_vagas: data.limite_vagas,
                    prestador_id: data.prestador_id,
        procedimento_id: data.procedimento_id,
          });
        } else {
          toast.error("Erro ao carregar dados da turma");
        }
      } catch (error) {
      } finally {
        setCarregando(false);
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
      {}
      {carregando ? (
        <div className="flex justify-center items-center w-full h-40">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Carregando ...</span>
        </div>
      ) : (
        <Form {...form}>
          <h1 className="text-2xl font-bold mb-4 mt-5">Nova Turma</h1>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto space-y-4 p-2"
          >
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="horario_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Início *</FormLabel>
                    <FormControl>
                      <Input {...field} type="time" placeholder="08:00" />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.horario_inicio?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="horario_fim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Fim *</FormLabel>
                    <FormControl>
                      <Input {...field} type="time" placeholder="08:00" />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.horario_fim?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="data_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início *</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.data_inicio?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                                  name="prestador_id"
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
                      {form.formState.errors.prestador_id?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                                  name="procedimento_id"
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
                      {form.formState.errors.procedimento_id?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="limite_vagas"
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
                      {form.formState.errors.limite_vagas?.message}
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
      )}
    </div>
  );
}