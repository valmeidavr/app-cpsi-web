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
import { getConvenioById, updateConvenio } from "@/app/api/convenios/action";

//Helpers
import { redirect, useParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabelaFaturamento } from "@/app/types/TabelaFaturamento";
import { http } from "@/util/http";
import { createConvenioSchema } from "@/app/api/convenios/schema/formSchemaConvenios";

export default function EditarConvenio() {
  const [loading, setLoading] = useState(false);
  const [convenio, setConvenio] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const params = useParams();
  const convenioId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [tabelaFaturamentos, setTabelaFaturamento] = useState<
    TabelaFaturamento[]
  >([]);

  const form = useForm({
    resolver: zodResolver(createConvenioSchema),
    mode: "onChange",
    defaultValues: {
      nome: "",
      regras: "",
      desconto: undefined,
      tabelaFaturamentosId: 0,
    },
  });

  const router = useRouter();

  const fetchTabelaFaturamento = async () => {
    try {
      const { data } = await http.get("/tabela-faturamentos", {});

      setTabelaFaturamento(data.data);
    } catch (error: any) {}
  };

  useEffect(() => {
    setCarregando(true);
    async function fetchData() {
      try {
        if (!convenioId) redirect("/painel/convenios");
        await fetchTabelaFaturamento();
        const data = await getConvenioById(convenioId);
        setConvenio(data);

        form.reset({
          nome: data.nome,
          regras: data.regras,
          desconto: data.desconto,
          tabelaFaturamentosId: data.tabelaFaturamentosId,
        });
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      } finally {
        setCarregando(false);
      }
    }
    fetchData();
  }, []);

  const onSubmit = async (values: z.infer<typeof createConvenioSchema>) => {
    setLoading(true);
    try {
      if (!convenioId) redirect("/painel/convenios");

      const data = await updateConvenio(convenioId, values);

      const queryParams = new URLSearchParams();

      queryParams.set("type", "success");
      queryParams.set("message", "Convênio atualizado com sucesso!");

      router.push(`/painel/convenios?${queryParams.toString()}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

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
          { label: "Editar Convênio" },
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
          <h1 className="text-2xl font-bold mb-6 mt-5">Editar Convênio</h1>

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
                name="tabelaFaturamentosId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tabela *</FormLabel>
                    <Select
                      value={field.value ? field.value.toString() : ""}
                      onValueChange={(value) => {
                        field.onChange(Number(value));
                      }}
                    >
                      <FormControl
                        className={
                          form.formState.errors.tabelaFaturamentosId
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
      )}
    </div>
  );
}
