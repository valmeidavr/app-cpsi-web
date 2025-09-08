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
import { updateTabelaFaturamentoSchema } from "@/app/api/tabela_faturamentos/schema/formSchemaEspecialidade";
export default function EditarTabelaFaturamento() {
  const [loading, setLoading] = useState(false);
  const [tabelaFaturamento, setTabelaFaturamento] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const params = useParams();
  const tabelaFaturamentoId = Array.isArray(params.id)
    ? params.id[0]
    : params.id;
  const form = useForm({
    resolver: zodResolver(updateTabelaFaturamentoSchema),
    mode: "onChange",
    defaultValues: {
      nome: "",
    },
  });
  const router = useRouter();
  useEffect(() => {
    setCarregando(true);
    async function fetchData() {
      try {
        if (!tabelaFaturamentoId) redirect("/painel/tabelaFaturamentos");
        const response = await fetch(`/api/tabela_faturamentos/${tabelaFaturamentoId}`);
        const data = await response.json();
        if (response.ok) {
          setTabelaFaturamento(data);
          form.reset({
            nome: data.nome,
          });
        } else {
          toast.error("Erro ao carregar dados da tabela de faturamento");
        }
      } catch (error) {
      } finally {
        setCarregando(false);
      }
    }
    fetchData();
  }, []);
  const onSubmit = async (
    values: z.infer<typeof updateTabelaFaturamentoSchema>
  ) => {
    setLoading(true);
    try {
      if (!tabelaFaturamentoId) redirect("/painel/tabelaFaturamentos");
      const response = await fetch(`/api/tabela_faturamentos/${tabelaFaturamentoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || "Erro ao atualizar tabela de faturamento.");
      }
      const queryParams = new URLSearchParams();
      queryParams.set("type", "success");
      queryParams.set("message", "Tabela atualizada com sucesso!");
      router.push(`/painel/tabela_faturamentos?${queryParams.toString()}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar tabela de faturamento");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          {
            label: "Tabelas Faturamentos",
            href: "/painel/tabela_faturamentos",
          },
          { label: "Editar Tabela Faturamento" },
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
          <h1 className="text-2xl font-bold mb-6 mt-5">
            Editar Tabela Faturamento
          </h1>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
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