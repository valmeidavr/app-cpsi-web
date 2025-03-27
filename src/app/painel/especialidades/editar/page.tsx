"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Label } from "@/components/ui/label";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { createUsuario } from "@/app/api/usuarios/action";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { http } from "@/util/http";

//api
import { createEspecialidade } from "@/app/api/especialidades/action";
import { formSchema } from "@/app/api/especialidades/schema/formSchemaEspecialidade";

export default function EditarEspecialidade() {
  const [loading, setLoading] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      nome: "",
      codigo: "",
    },
  });

  //   try {
  //     console.log("Usuário", values);
  //     await createUsuario(values);

  //     router.push("/painel/usuarios?status=success");
  //   } catch (error: any) {
  //     const errorMessage =
  //       error.response?.data?.message || "Erro ao salvar usuário";

  //     // Exibindo toast de erro
  //     toast.error(errorMessage);
  //   } finally {
  //     setLoading(false);
  //   }
  //   console.log(values);
  //   setLoading(false);
  // };

  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Especialidades", href: "/painel/especialidades" },
          { label: "Editar Especialidade" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-6 mt-5">Editar Especialidade</h1>

      <Form {...form}>
        <form className="space-y-4">
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
