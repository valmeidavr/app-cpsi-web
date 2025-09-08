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
import { updatePlanosSchema } from "@/app/api/plano_contas/schema/formSchemaPlanos";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
export default function EditarPlanoConta() {
  const [loading, setLoading] = useState(false);
  const [planoConta, setPlanoConta] = useState(null);
  const params = useParams();
  const planoContaId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [carregando, setCarregando] = useState(false);
  const form = useForm({
    resolver: zodResolver(updatePlanosSchema),
    mode: "onChange",
    defaultValues: {
      nome: "",
      categoria: "",
      descricao: "",
    },
  });
  const router = useRouter();
  useEffect(() => {
    setCarregando(true);
    async function fetchData() {
      try {
        if (!planoContaId) redirect("/painel/plano_contas");
        const response = await fetch(`/api/plano_contas/${planoContaId}`);
        const data = await response.json();
        if (response.ok) {
          setPlanoConta(data);
          form.reset({
            nome: data.nome,
            categoria: data.categoria,
            descricao: data.descricao,
          });
        } else {
          toast.error("Erro ao carregar dados do plano de contas");
        }
      } catch (error) {
      } finally {
        setCarregando(false);
      }
    }
    fetchData();
  }, []);
  const onSubmit = async (values: z.infer<typeof updatePlanosSchema>) => {
    setLoading(true);
    try {
      if (!planoContaId) redirect("/painel/plano_contas");
      const response = await fetch(`/api/plano_contas/${planoContaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || "Erro ao atualizar plano de contas.");
      }
      const queryParams = new URLSearchParams();
      queryParams.set("type", "success");
      queryParams.set("message", "Plano de contas atualizado com sucesso!");
      router.push(`/painel/plano_contas?${queryParams.toString()}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar plano de contas");
    } finally {
      setLoading(false);
    }
  };
  const tipoOptions = [
    { value: "ENTRADA", label: "ENTRADA" },
    { value: "SAIDA", label: "SAIDA" },
  ];
  const fetchPlanos = async () => {
    try {
      const response = await fetch('/api/plano_contas');
      const data = await response.json();
      if (response.ok) {
        setPlanoConta(data.data);
      }
    } catch (error) { }
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
      {}
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
            {}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plano *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className={`border ${form.formState.errors.nome
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
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className={`border ${form.formState.errors.categoria
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
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      rows={4} // Você pode ajustar o número de linhas conforme necessário
                      className={`w-full px-3 py-2 rounded-md border ${form.formState.errors.descricao
                        ? "border-red-500"
                        : "border-gray-300"
                        } focus:ring-2 focus:ring-primary focus:outline-none`}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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