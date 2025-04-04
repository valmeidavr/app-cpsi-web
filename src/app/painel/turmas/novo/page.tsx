"use client";

//React
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

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

//Helpers
import { useRouter } from "next/navigation";
import { formSchema } from "@/app/api/turmas/schema/formSchemaTurmas";
import { createTurma } from "@/app/api/turmas/action";
import { getPrestadors } from "@/app/api/prestadores/action";
import { Prestador, Procedimento } from "../page";
import { getProcedimentos } from "@/app/api/procedimentos/action";

export default function NovoTurma() {
  const [loading, setLoading] = useState(false);
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);

  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(formSchema),
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

  const fetchPrestadores = async () => {
    try {
      const { data } = await getPrestadors();
      setPrestadores(data);
    } catch (error: any) {
      toast.error("Erro ao carregar dados dos prestadores");
    }
  };
  const fetchProcedimentos = async () => {
    try {
      const { data } = await getProcedimentos();
      setProcedimentos(data);
    } catch (error: any) {
      toast.error("Erro ao carregar dados dos procedimentos");
    }
  };

  useEffect(() => {
    fetchPrestadores();
    fetchProcedimentos();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      await createTurma(values);
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
    </div>
  );
}
