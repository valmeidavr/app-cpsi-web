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

//Helpers
import { redirect, useParams } from "next/navigation";
import { getUnidadeById, updateUnidade } from "@/app/api/unidades/action";
import { formSchema } from "@/app/api/unidades/schema/formSchemaUnidades";

export default function EditarUnidade() {
  const [loading, setLoading] = useState(false);
  const [unidade, setUnidade] = useState(null);
  const params = useParams();
  const unidadeId = Array.isArray(params.id) ? params.id[0] : params.id;

  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      nome: "",
    },
  });

  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        if (!unidadeId) redirect("/painel/unidades");
        const data = await getUnidadeById(unidadeId);
        setUnidade(data);

        form.reset({
          nome: data.nome,
        });
      } catch (error) {
        console.error("Erro ao unidade:", error);
      }
    }
    fetchData();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      if (!unidadeId) redirect("/painel/unidades");

      const data = await updateUnidade(unidadeId, values);
      const queryParams = new URLSearchParams();

      queryParams.set("type", "success");
      queryParams.set("message", "Unidade atualizada com sucesso!");

      router.push(`/painel/unidades?${queryParams.toString()}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Unidades", href: "/painel/unidades" },
          { label: "Editar Unidade" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-6 mt-5">Editar Unidade</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Campos de Nome e Código */}
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
    </div>
  );
}
