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
import { useRouter } from "next/navigation";
import { http } from "@/util/http";

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
  const [tabelaFaturamentos, setTabelaFaturamento] = useState<
    TabelaFaturamento[]
  >([]);

  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(createConvenioSchema),
    mode: "onChange",
    defaultValues: {
      nome: "",
      regras: "",
      desconto: undefined,
      tabela_faturamento_id: 0,
    },
  });

  const onSubmit = async (values: z.infer<typeof createConvenioSchema>) => {
    setLoading(true);
    try {
      await http.post("/api/convenios", values);

      const currentUrl = new URL(window.location.href);
      const queryParams = new URLSearchParams(currentUrl.search);

      queryParams.set("type", "success");
      queryParams.set("message", "Convênio salvo com sucesso!");

      router.push(`/painel/convenios?${queryParams.toString()}`);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Erro ao salvar convênio";

      // Exibindo toast de erro
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
    setLoading(false);
  };

  const fetchTabelaFaturamento = async () => {
    try {
      const { data } = await http.get("/tabela-faturamentos", {});

      setTabelaFaturamento(data.data);
    } catch (error: any) {}
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
                      field.onChange(Number(value));
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
                      {tabelaFaturamentos.map((option) => (
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
    </div>
  );
}
