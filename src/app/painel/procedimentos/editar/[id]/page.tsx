"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { redirect, useParams } from "next/navigation";
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
import { updateProcedimentoSchema } from "@/app/api/procedimentos/schema/formSchemaProcedimentos";
import { Especialidade } from "@/app/types/Especialidade";
import { Procedimento } from "@/app/types/Procedimento";
export default function EditarProcedimento() {
  const [loading, setLoading] = useState(false);
  const [procedimento, setProcedimento] = useState<Procedimento | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [especialidadeOptions, setEspecialidadeOptions] = useState<
    Especialidade[]
  >([]);
  const params = useParams();
  const procedimentoId = Array.isArray(params.id) ? params.id[0] : params.id;
  const form = useForm({
    resolver: zodResolver(updateProcedimentoSchema),
    mode: "onChange",
    defaultValues: {
      nome: "",
      codigo: "",
      tipo: "",
      especialidade_id: 0,
    },
  });
  const router = useRouter();
  const fetchEspecialidade = async () => {
    try {
      const response = await fetch("/api/especialidades");
      const data = await response.json();
      if (response.ok) {
        setEspecialidadeOptions(data.data);
      } else {
      }
    } catch (error) {
    }
  };
  useEffect(() => {
    setCarregando(true);
    async function fetchData() {
      try {
        if (!procedimentoId) redirect("/painel/procedimentos");
        await fetchEspecialidade();
        const response = await fetch(`/api/procedimentos/${procedimentoId}`);
        const data = await response.json();
        if (response.ok) {
          console.log("Dados recebidos da API:", data);
          console.log("Tipo do procedimento:", data.tipo);
          setProcedimento(data);
          form.reset({
            nome: data.nome,
            codigo: data.codigo,
            tipo: data.tipo,
            especialidade_id: data.especialidade_id || 0,
          });
          // Garantir que o campo tipo seja definido corretamente
          form.setValue("tipo", data.tipo);
          console.log("Valor do form após setValue:", form.getValues("tipo"));
        } else {
          toast.error("Erro ao carregar dados do procedimento");
        }
      } catch (error) {
      } finally {
        setCarregando(false);
      }
    }
    fetchData();
  }, []);

  // UseEffect separado para sincronizar o campo tipo
  useEffect(() => {
    if (procedimento?.tipo) {
      console.log("Sincronizando tipo:", procedimento.tipo);
      form.setValue("tipo", procedimento.tipo);
    }
  }, [procedimento?.tipo, form]);
  const onSubmit = async (values: z.infer<typeof updateProcedimentoSchema>) => {
    setLoading(true);
    try {
      if (!procedimentoId) redirect("/painel/procedimentos");
      const response = await fetch(`/api/procedimentos/${procedimentoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: values.nome,
          codigo: values.codigo,
          tipo: values.tipo,
          especialidade_id: values.especialidade_id ? parseInt(values.especialidade_id.toString()) : null
        }),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || "Erro ao atualizar procedimento.");
      }
      const queryParams = new URLSearchParams();
      queryParams.set("type", "success");
      queryParams.set("message", "Procedimento atualizado com sucesso!");
      router.push(`/painel/procedimentos?${queryParams.toString()}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar procedimento");
    } finally {
      setLoading(false);
    }
  };
  const tipoOptions = [
    { value: "SESSÃO", label: "SESSÃO" },
    { value: "MENSAL", label: "MENSAL" },
  ];
  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Procedimentos", href: "/painel/procedimentos" },
          { label: "Editar Procedimento" },
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
          <h1 className="text-2xl font-bold mb-6 mt-5">Editar Procedimento</h1>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Procedimento *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className={`border ${
                          form.formState.errors.nome
                            ? "border-red-500"
                            : "border-gray-300"
                        } focus:ring-2 focus:ring-primary`}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className={`border ${
                          form.formState.errors.codigo
                            ? "border-red-500"
                            : "border-gray-300"
                        } focus:ring-2 focus:ring-primary`}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || procedimento?.tipo || ""}
                      key={`select-tipo-${procedimento?.id || "new"}`}
                    >
                      <FormControl
                        className={
                          form.formState.errors.tipo
                            ? "border-red-500"
                            : "border-gray-300"
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tipoOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-500 mt-1 font-light" />
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
                      value={field.value ? field.value.toString() : ""}
                      onValueChange={(value) => {
                        field.onChange(Number(value));
                      }}
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
                        {especialidadeOptions.map((option) => (
                          <SelectItem
                            key={option.id}
                            value={option.id.toString()}
                          >
                            {option.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-500 mt-1 font-light" />
                  </FormItem>
                )}
              />
            </div>
            {}
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Salvar
                </>
              )}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}