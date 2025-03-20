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
import { formSchema } from "@/app/api/usuarios/schema/formSchemaUsuarios";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { createUsuario } from "@/app/api/usuarios/action";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { SistemaComGrupos } from "@/app/types/Usuario";
import { http } from "@/util/http";

export default function UsuarioRegistrationForm() {
  const [loading, setLoading] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<Record<number, number>>(
    {}
  );
  const [sistemas, setSistemas] = useState<SistemaComGrupos[]>([]);

  
  useEffect(() => {
    async function fetchSistemas() {
      try {
        const { data } = await http.get("http://localhost:3000/sistemas");
        setSistemas(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao carregar sistemas:", error);
      }
    }
    fetchSistemas();
  }, []);
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      nome: "",
      email: "",
      senha: "",
      confirmedsenha: "",
      sistema: {},
    },
  });

  const handleGroupChange = (sistemaId: number, grupoId: number) => {
    setSelectedGroups((prev) => ({ ...prev, [sistemaId]: grupoId }));
    form.setValue(`sistema.${sistemaId}`, grupoId, { shouldValidate: true });
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);

    try {
      console.log("Usuário", values);
      await createUsuario(values);

      router.push("/painel/usuarios?status=success");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Erro ao salvar usuário";

      // Exibindo toast de erro
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
    console.log(values);
    setLoading(false);
  };

  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Gerenciar Usuários", href: "/painel/usuarios" },
          { label: "Novo Usuários" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-4 mt-5">Novo Usuário</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Campos de Nome e Email */}
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    {...field}
                    className={`border ${
                      form.formState.errors.email
                        ? "border-red-500"
                        : "border-gray-300"
                    } focus:ring-2 focus:ring-primary`}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="senha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha *</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      {...field}
                      value={field.value || ""}
                      className={`border ${
                        form.formState.errors.senha
                          ? "border-red-500"
                          : "border-gray-300"
                      } focus:ring-2 focus:ring-primary`}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm mt-1">
                    {form.formState.errors.senha?.message}
                  </FormMessage>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmedsenha"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirma Senha</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      {...field}
                      value={field.value || ""}
                      className={`border ${
                        form.formState.errors.confirmedsenha
                          ? "border-red-500"
                          : "border-gray-300"
                      } focus:ring-2 focus:ring-primary`}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm mt-1">
                    {form.formState.errors.confirmedsenha?.message}
                  </FormMessage>
                </FormItem>
              )}
            />
          </div>
          {/* Seção de Sistemas e Grupos */}

          <div className="space-y-4">
            {sistemas.map((sistema) => (
              <div key={sistema.id} className="border p-4 rounded-md">
                <h3 className="font-bold mb-2">{sistema.nome}</h3>
                <RadioGroup
                  value={selectedGroups[sistema.id]?.toString() || ""}
                  onValueChange={(value: any) =>
                    handleGroupChange(sistema.id, Number(value))
                  }
                  className="space-y-2"
                >
                  {sistema.grupos.map((grupo) => (
                    <FormField
                      key={grupo.id}
                      control={form.control}
                      name={`sistema.${sistema.id}`}
                      render={() => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem
                              id={`grupo-${sistema.id}-${grupo.id}`}
                              value={grupo.id.toString()}
                            />
                          </FormControl>
                          <Label
                            htmlFor={`grupo-${sistema.id}-${grupo.id}`}
                            className="cursor-pointer"
                          >
                            {grupo.nome}
                          </Label>
                        </FormItem>
                      )}
                    />
                  ))}
                </RadioGroup>
              </div>
            ))}
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
