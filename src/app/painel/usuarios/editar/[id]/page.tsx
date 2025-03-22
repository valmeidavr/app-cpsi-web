"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Save, Loader2, Eye, EyeOff } from "lucide-react";
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

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { getUsuarioById, updateUsuario } from "@/app/api/usuarios/action";
import { redirect, useParams, useRouter } from "next/navigation";
import { z } from "zod";
import { SistemaComGrupos } from "@/app/types/Usuario";
import { http } from "@/util/http";
import { formSchemaUpdate } from "@/app/api/usuarios/schema/formShemaUpdateUsuario";

export default function UsuarioUpdateForm() {
  const [loading, setLoading] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<Record<number, number>>(
    {}
  );
  const [sistemas, setSistemas] = useState<SistemaComGrupos[]>([]);
  const [usuario, setUsuario] = useState(null);
  const params = useParams();
  const [isFormReset, setIsFormReset] = useState(false);
  const userId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        if (!userId) redirect("/painel/usuarios");
        const data = await getUsuarioById(userId);
        setUsuario(data);
        if (sistemas.length > 0) {
          const gruposSelecionados = data.grupos.reduce(
            (acc: any, item: any) => {
              sistemas.forEach((sistema) => {
                if (
                  sistema.grupos.some((grupo) => grupo.id === item.grupo.id)
                ) {
                  acc[sistema.id] = item.grupo.id;
                }
              });
              return acc;
            },
            {}
          );

          setSelectedGroups(gruposSelecionados);

          if (!isFormReset) {
            form.reset({
              nome: data.nome,
              email: data.email,
              senha: "",
              confirmedsenha: "",
              grupoIds: selectedGroups,
            });
            setIsFormReset(true);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      }
    }

    async function fetchSistemas() {
      try {
        const { data } = await http.get("http://localhost:3000/sistemas");
        setSistemas(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao carregar sistemas:", error);
      }
    }
    if (userId && sistemas.length === 0) {
      fetchSistemas();
    }
    if (userId) {
      fetchData();
    }
  }, [userId, sistemas]);

  const form = useForm({
    resolver: zodResolver(formSchemaUpdate),
    mode: "onChange",
    defaultValues: {
      nome: "",
      email: "",
      senha: "",
      confirmedsenha: "",
      grupoIds: {},
    },
  });

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev); // Alterna a visibilidade da senha
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev); // Alterna a visibilidade da confirmação de senha
  };

  const handleGroupChange = (sistemaId: number, grupoId: number) => {
    setSelectedGroups((prev) => ({ ...prev, [sistemaId]: grupoId }));
    form.setValue(`grupoIds.${sistemaId}`, grupoId, { shouldValidate: true });
  };

  const onSubmit = async (values: z.infer<typeof formSchemaUpdate>) => {
    setLoading(true);
    try {
      if (!userId) redirect("/painel/usuarios");

      const data = await updateUsuario(userId, values);

      router.push("/painel/usuarios?status=updated");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Gerenciar Usuários", href: "/painel/usuarios" },
          { label: "Editar Usuário" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-4 mt-5">Editar Usuário</h1>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((data) => {
            onSubmit(data);
          })}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome *</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input type="email" {...field} />
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
                    <div className="relative">
                      <Input
                        autoComplete="new-password"
                        type={showPassword ? "text" : "password"}
                        {...field}
                        className={`border ${
                          form.formState.errors.senha
                            ? "border-red-500"
                            : "border-gray-300"
                        } focus:ring-2 focus:ring-primary pr-10`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className=" h-8 w-8 absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={togglePasswordVisibility}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
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
                  <FormLabel>Confirmar Senha *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        {...field}
                        className={`border ${
                          form.formState.errors.confirmedsenha
                            ? "border-red-500"
                            : "border-gray-300"
                        } focus:ring-2 focus:ring-primary pr-10`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className=" h-8 w-8 absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={toggleConfirmPasswordVisibility}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm mt-1">
                    {form.formState.errors.confirmedsenha?.message}
                  </FormMessage>
                </FormItem>
              )}
            />
          </div>
          <div className="space-y-4">
            {sistemas.map((sistema) => (
              <div key={sistema.id} className="border p-4 rounded-md">
                <h3 className="font-bold mb-2">{sistema.nome}</h3>
                <RadioGroup
                  value={selectedGroups[sistema.id]?.toString() || ""}
                  onValueChange={(value) =>
                    handleGroupChange(sistema.id, Number(value))
                  }
                  className="space-y-2"
                >
                  {sistema.grupos.map((grupo) => (
                    <FormField
                      key={grupo.id}
                      control={form.control}
                      name={`grupoIds.${sistema.id}`}
                      render={() => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem
                              id={`grupo-${sistema.id}-${grupo.id}`}
                              value={grupo.id.toString()}
                              checked={selectedGroups[sistema.id] === grupo.id}
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
                <Save className="w-4 h-4" /> Atualizar
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
