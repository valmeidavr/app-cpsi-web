"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCaixaSchema } from "@/app/api/caixa/schema/formSchemaCaixa";
export default function NovoCaixa() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const tipoOptions = [
    { value: "CAIXA", label: "CAIXA" },
    { value: "BANCO", label: "BANCO" },
  ];
  const form = useForm({
    resolver: zodResolver(createCaixaSchema),
    defaultValues: {
      nome: "",
      saldo: 0,
      tipo: "",
    },
  });
  const onSubmit = async (values: z.infer<typeof createCaixaSchema>) => {
    setLoading(true);
    try {
      const response = await fetch("/api/caixa", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || "Erro ao salvar caixa!");
      }
      const currentUrl = new URL(window.location.href);
      const queryParams = new URLSearchParams(currentUrl.search);
      queryParams.set("type", "success");
      queryParams.set("message", "Caixa salvo com sucesso!");
      router.push(`/painel/caixas?${queryParams.toString()}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao salvar caixa!";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Lista de Caixas", href: "/painel/caixas" },
          { label: "Novo Caixa" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-6 mt-5">Novo Caixa</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {" "}
          {}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Caixa *</FormLabel>
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
              name="saldo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className={`border ${
                        form.formState.errors.saldo
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
          {}
          <Button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 !mt-8"
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