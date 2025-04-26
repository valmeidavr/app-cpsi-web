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
import { getCaixaById, getCaixa, updateCaixa } from "@/app/api/caixa/action";
import { updateCaixaSchema } from "@/app/api/caixa/schema/formSchemaCaixa";

//Helpers
import { redirect, useParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Caixa } from "@/app/types/Caixa";

export default function EditarCaixa() {
  const [loading, setLoading] = useState(false);
  const [caixa, setCaixa] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [caixaOptions, setCaixaOptions] = useState<Caixa[]>([]);
  const params = useParams();
  const caixaId = Array.isArray(params.id) ? params.id[0] : params.id;

  const form = useForm({
    resolver: zodResolver(updateCaixaSchema),
    mode: "onChange",
    defaultValues: {
      nome: "",
      saldo: "" as unknown as number,
      tipo: "",
    },
  });

  const router = useRouter();
  useEffect(() => {
    setCarregando(true);
    async function fetchData() {
      try {
        if (!caixaId) redirect("/painel/caixas");
        await fetchCaixas();
        const data = await getCaixaById(caixaId);
        setCaixa(data);
        form.reset({
          nome: data.nome,
          saldo: data.saldo,
          tipo: data.tipo,
        });
      } catch (error) {
        console.error("Erro ao carregar caixa:", error);
      } finally {
        setCarregando(false);
      }
    }
    fetchData();
  }, []);

  const onSubmit = async (values: z.infer<typeof updateCaixaSchema>) => {
    setLoading(true);
    try {
      if (!caixaId) redirect("/painel/caixas");

      const queryParams = new URLSearchParams();

      queryParams.set("type", "success");
      queryParams.set("message", "Caixa salvo com sucesso!");

      router.push(`/painel/caixas?${queryParams.toString()}`);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Erro ao salvar caixa!";

      // Exibindo toast de erro
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
    setLoading(false);
  };

  const tipoOptions = [
    { value: "CAIXA", label: "CAIXA" },
    { value: "BANCO", label: "BANCO" },
  ];

  const fetchCaixas = async () => {
    try {
      const { data } = await getCaixa();
      setCaixaOptions(data);
    } catch (error: any) {}
  };

  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Lista de Caixas", href: "/painel/caixas" },
          { label: "Editar Caixa" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-6 mt-5">Editar Caixa</h1>

      {/* Loader - Oculta a Tabela enquanto carrega */}
      {carregando ? (
        <div className="flex justify-center items-center w-full h-40">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Carregando ...</span>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {" "}
            {/* Campos do fomulário*/}
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
          {/* Botão de Envio */}
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
      )}
    </div>
  );
}
