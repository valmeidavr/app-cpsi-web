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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

//API
import { createProcedimento } from "@/app/api/procedimentos/action";
import { formSchema } from "@/app/api/procedimentos/schema/formSchemaProcedimentos";

//Helpers
import { useRouter } from "next/navigation";

export default function NovoProcedimento() {
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      nome: "",
      codigo: "",
      tipo: "",
      especialidadeTeste: "",
    },
  });

  // const onSubmit = async (values: z.infer<typeof formSchema>) => {
  //   setLoading(true);
  //   try {
  //     console.log("Procedimento", values);
  //     await createProcedimento(values);

  //     router.push("/painel/procedimentos?status=success");
  //   } catch (error: any) {
  //     const errorMessage =
  //       error.response?.data?.message || "Erro ao salvar procedimento";

  //     // Exibindo toast de erro
  //     toast.error(errorMessage);
  //   } finally {
  //     setLoading(false);
  //   }
  //   console.log(values);
  //   setLoading(false);
  // };

  // Mockup de opçoes de Tipo
  const tipoOptions = [
    { value: "SESSÃO", label: "SESSÃO" },
    { value: "MENSAL", label: "MENSAL" },
  ];

  // Mockup de opçoes de Especialidade
  const especialidadeOptions = [
    { value: "Cardiologista", label: "Cardiologista" },
    { value: "Fisioterapeuta", label: "Fisioterapeuta" },
    { value: "Radiologista", label: "Radiologista" },
    { value: "Nefrologista", label: "Nefrologista" },
  ];

  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Procedimentos", href: "/painel/procedimentos" },
          { label: "Novo Procedimento" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-6 mt-5">Novo Procedimento</h1>

      <Form {...form}>
        <form className="space-y-4">
          {" "}
          {/*onSubmit={form.handleSubmit(onSubmit)}*/}
          {/* Campos de Nome e Código */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Procedimento *</FormLabel>
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
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="especialidadeTeste"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especialidade *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl
                      className={
                        form.formState.errors.especialidadeTeste
                          ? "border-red-500"
                          : "border-gray-300"
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {especialidadeOptions.map((option) => (
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
