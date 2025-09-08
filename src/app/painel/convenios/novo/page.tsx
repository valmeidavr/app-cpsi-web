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
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabelaFaturamento } from "@/app/types/TabelaFaturamento";
import { createConvenioSchema } from "@/app/api/convenios/schema/formSchemaConvenios";
export default function NovoConvenio() {
  const [loading, setLoading] = useState(false);
  const [tabelaFaturamento, setTabelaFaturamento] = useState<
    TabelaFaturamento[]
  >([]);
  const router = useRouter();
  const form = useForm<z.infer<typeof createConvenioSchema>>({
    resolver: zodResolver(createConvenioSchema),
    mode: "onChange",
    defaultValues: {
      nome: "",
      regras: "",
      desconto: 0,
      tabela_faturamento_id: undefined,
    },
  });
  const onSubmit = async (values: z.infer<typeof createConvenioSchema>) => {
    setLoading(true);
    try {
      if (!values.tabela_faturamento_id || values.tabela_faturamento_id <= 0) {
        toast.error("Selecione uma tabela de faturamento válida");
        setLoading(false);
        return;
      }
      const response = await fetch("/api/convenios", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar convênio');
      }
      const currentUrl = new URL(window.location.href);
      const queryParams = new URLSearchParams(currentUrl.search);
      queryParams.set("type", "success");
      queryParams.set("message", "Convênio salvo com sucesso!");
      router.push(`/painel/convenios?${queryParams.toString()}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao salvar convênio";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  const fetchTabelaFaturamento = async () => {
    try {
      const response = await fetch("/api/tabela_faturamentos");
      const data = await response.json();
      if (response.ok) {
        setTabelaFaturamento(data.data);
      } else {
      }
    } catch (error) {
    }
  };
  useEffect(() => {
    fetchTabelaFaturamento();
  }, []);
  const regrasOption = [
    { value: "CONVENIO", label: "CONVÊNIO" },
    { value: "AAPVR", label: "AAPVR" },
    { value: "PARTICULAR", label: "PARTICULAR" },
  ];
  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Convênios", href: "/painel/convenios" },
          { label: "Novo Convênio" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-6 mt-5">Novo Convênio</h1>
      <Form {...form}>
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
            <FormField
              control={form.control}
              name="desconto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Desconto *</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="0%"
                      value={
                        field.value !== undefined && field.value !== null
                          ? `${field.value}%`
                          : ""
                      }
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, "");
                        let value = Number(raw);
                        if (isNaN(value)) value = 0;
                        if (value > 100) value = 100;
                        if (value < 0) value = 0;
                        field.onChange(value);
                      }}
                      className={`border ${
                        form.formState.errors.desconto
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
              name="regras"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Regras *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl
                      className={
                        form.formState.errors.regras
                          ? "border-red-500"
                          : "border-gray-300"
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {regrasOption.map((option) => (
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
              name="tabela_faturamento_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tabela de Faturamento *</FormLabel>
                  <Select
                    value={field.value ? field.value.toString() : ""}
                    onValueChange={(value) => {
                      const numValue = Number(value);
                      field.onChange(numValue);
                    }}
                  >
                    <FormControl
                      className={
                        form.formState.errors.tabela_faturamento_id
                          ? "border-red-500"
                          : "border-gray-300"
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tabelaFaturamento.map((option) => (
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
    </div>
  );
}