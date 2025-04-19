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

//Helpers
import { useRouter, useSearchParams } from "next/navigation";
import { createPlano } from "@/app/api/plano_contas/action";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPlanosSchema } from "@/app/api/plano_contas/schema/formSchemaPlanos";

export default function NovoPlano() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const tipoOptions = [
    { value: "ENTRADA", label: "ENTRADA" },
    { value: "SAIDA", label: "SAIDA" },
  ];

  const form = useForm({
    resolver: zodResolver(createPlanosSchema),
    defaultValues: {
      nome: "",
      tipo: "",
      categoria: "",
      descricao: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof createPlanosSchema>) => {
    setLoading(true);
    try {
      await createPlano(values);

      const currentUrl = new URL(window.location.href);
      const queryParams = new URLSearchParams(currentUrl.search);

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

  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Planos de conta", href: "/painel/plano_contas" },
          { label: "Novo Plano" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-6 mt-5">Novo Plano</h1>
      <Form {...form}>
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
    </div>
  );
}
