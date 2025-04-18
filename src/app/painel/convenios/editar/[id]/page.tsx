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
import { formSchema } from "@/app/api/convenios/schema/formSchemaConvenios";

//Helpers
import { redirect, useParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TabelaFaturamentoDTO } from "@/app/types/TabelaFaturamento";
import { http } from "@/util/http";

export default function EditarConvenio() {
  const [loading, setLoading] = useState(false);
  const [convenio, setConvenio] = useState(null);
  const params = useParams();
  const convenioId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [tabelaFaturamentos, setTabelaFaturamento] = useState<
    TabelaFaturamentoDTO[]
  >([]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      nome: "",
      regras: "",
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
    async function fetchData() {
      try {
        if (!convenioId) redirect("/painel/convenios");
        await fetchTabelaFaturamento();
        const data = await getConvenioById(convenioId);
        setConvenio(data);

        form.reset({
          nome: data.nome,
          regras: data.regras,
          tabelaFaturamentosId: data.tabelaFaturamentosId,
        });
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      }
    }
    fetchData();
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
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
          { label: "Convenios", href: "/painel/convenios" },
          { label: "Editar Convenio" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-6 mt-5">Editar Convenio</h1>

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
    </div>
  );
}
