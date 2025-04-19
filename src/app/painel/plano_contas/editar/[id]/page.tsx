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

//API
import {
  getPlanoById,
  getPlanos,
  updatePlano,
} from "@/app/api/plano_contas/action";
import { updatePlanosSchema } from "@/app/api/plano_contas/schema/formSchemaPlanos";

//Helpers
import { redirect, useParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { PlanoConta } from "@/app/types/PlanoConta";

export default function EditarPlano() {
  const [loading, setLoading] = useState(false);
  const [plano, setPlano] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [planosOptions, setPlanosOptions] = useState<PlanoConta[]>([]);
  const params = useParams();
  const planoId = Array.isArray(params.id) ? params.id[0] : params.id;

  const form = useForm({
    resolver: zodResolver(updatePlanosSchema),
    mode: "onChange",
    defaultValues: {
      nome: "",
      tipo: "",
      categoria: "",
      descricao: "",
    },
  });

  const router = useRouter();
  useEffect(() => {
    setCarregando(true);
    async function fetchData() {
      try {
        if (!planoId) redirect("/painel/plano_contas");
        await fetchPlanos();
        const data = await getPlanoById(planoId);
        setPlano(data);
        form.reset({
          nome: data.nome,
          tipo: data.tipo,
          categoria: data.categoria,
          descricao: data.descricao,
        });
      } catch (error) {
        console.error("Erro ao carregar plano:", error);
      } finally {
        setCarregando(false);
      }
    }
    fetchData();
  }, []);

  const onSubmit = async (values: z.infer<typeof updatePlanosSchema>) => {
    setLoading(true);
    try {
      if (!planoId) redirect("/painel/plano_contas");

      const queryParams = new URLSearchParams();

      queryParams.set("type", "success");
      queryParams.set("message", "Plano salvo com sucesso!");

      router.push(`/painel/plano_contas?${queryParams.toString()}`);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Erro ao salvar plano!";

      // Exibindo toast de erro
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
    setLoading(false);
  };

  const tipoOptions = [
    { value: "ENTRADA", label: "ENTRADA" },
    { value: "SAIDA", label: "SAIDA" },
  ];

  const fetchPlanos = async () => {
    try {
      const { data } = await getPlanos();
      setPlanosOptions(data);
    } catch (error: any) {}
  };

  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Plano de Conta", href: "/painel/plano_contas" },
          { label: "Editar Plano" },
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
          <h1 className="text-2xl font-bold mb-4 mt-5">Editar Plano</h1>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {" "}
            {/* Campos do fomulário*/}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plano *</FormLabel>
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
                    <FormMessage className="text-red-500 text-sm mt-1" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className={`border ${
                          form.formState.errors.categoria
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
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className={`border ${
                          form.formState.errors.descricao
                            ? "border-red-500"
                            : "border-gray-300"
                        } focus:ring-2 focus:ring-primary`}
                      />
                    </FormControl>
                    <FormMessage />
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
