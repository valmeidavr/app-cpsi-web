"use client";

//React
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { redirect, useParams } from "next/navigation";

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
import {
  getProcedimentoById,
  updateProcedimento,
} from "@/app/api/procedimentos/action";
import { updateProcedimentoSchema } from "@/app/api/procedimentos/schema/formSchemaProcedimentos";
import { getEspecialidades } from "@/app/api/especialidades/action";

//Types
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
      especialidadeId: 0,
    },
  });

  const router = useRouter();

  useEffect(() => {
    setCarregando(true);
    async function fetchData() {
      try {
        if (!procedimentoId) redirect("/painel/procedimentos");
        await fetchEspecialidade();
        const data = await getProcedimentoById(procedimentoId);
        setProcedimento(data);
        form.reset({
          nome: data.nome,
          codigo: data.codigo,
          tipo: data.tipo,
          especialidadeId: data.especialidadeId
            ? data.especialidadeId.toString()
            : 0,
        });
      } catch (error) {
        console.error("Erro ao carregar procedimento:", error);
      } finally {
        setCarregando(false);
      }
    }
    fetchData();
  }, []);

  const onSubmit = async (values: z.infer<typeof updateProcedimentoSchema>) => {
    setLoading(true);
    try {
      if (!procedimentoId) redirect("/painel/procedimentos");

      const data = await updateProcedimento(procedimentoId, {
        ...values,
        especialidadeId: Number(values.especialidadeId),
      });
      const queryParams = new URLSearchParams();

      queryParams.set("type", "success");
      queryParams.set("message", "Procedimento atualizado com sucesso");

      router.push(`/painel/procedimentos?${queryParams.toString()}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEspecialidade = async () => {
    try {
      const { data } = await getEspecialidades();
      setEspecialidadeOptions(data);
    } catch (error: any) {}
  };
  // Mockup de opçoes de Tipo
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

      {/* Loader - Oculta a Tabela enquanto carrega */}
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
                      value={field.value || ""}
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
                name="especialidadeId"
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
                          form.formState.errors.especialidadeId
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
            {/* Botão de Envio */}
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
