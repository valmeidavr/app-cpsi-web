"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { http } from "@/util/http";
import { createTurmaSchema } from "@/app/api/turmas/schema/formSchemaTurmas";
import { Prestador } from "@/app/types/Prestador";
import { Procedimento } from "@/app/types/Procedimento";
export default function NovoTurma() {
  const [loading, setLoading] = useState(false);
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const router = useRouter();
  const form = useForm({
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
  const fetchPrestadores = async () => {
    try {
      const response = await fetch("/api/prestadores?all=true");
      const data = await response.json();
      if (response.ok) {
        setPrestadores(data.data);
      } else {
        toast.error("Erro ao carregar prestadores");
      }
    } catch (error) {
      toast.error("Erro ao carregar dados dos prestadores");
    }
  };
  const fetchProcedimentos = async () => {
    try {
      const response = await fetch("/api/procedimentos?limit=1000");
      const data = await response.json();
      if (response.ok) {
        setProcedimentos(data.data);
      } else {
        toast.error("Erro ao carregar procedimentos");
      }
    } catch (error) {
      toast.error("Erro ao carregar dados dos procedimentos");
    }
  };
  useEffect(() => {
    fetchPrestadores();
    fetchProcedimentos();
  }, []);
  const onSubmit = async (values: z.infer<typeof createTurmaSchema>) => {
    setLoading(true);
    try {
      await http.post("/api/turmas", values);
       router.push("/painel/turmas?type=success&message=Salvo com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar turma");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col flex-1 h-full">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Turmas", href: "/painel/turmas" },
          { label: "Nova Turma" },
        ]}
      />
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
                  <FormLabel>Prestador *</FormLabel>
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
    </div>
  );
}
