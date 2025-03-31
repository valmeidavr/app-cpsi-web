"use client";

//React
import React, { useState } from "react";
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

//API
import { createEspecialidade } from "@/app/api/especialidades/action";
import { formSchema } from "@/app/api/especialidades/schema/formSchemaEspecialidade";

//Helpers
import { useRouter } from "next/navigation";

export default function NovaEspecialidade() {
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      nome: "",
      codigo: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      await createEspecialidade(values);

      router.push("/painel/especialidades?status=success");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Erro ao salvar especialidade";

      // Exibindo toast de erro
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Especialidades", href: "/painel/especialidades" },
          { label: "Nova Especialidade" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-6 mt-5">Nova Especialidade</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Campos de Nome e Código */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especialidade *</FormLabel>
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
