"use client";
//React
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { redirect, useParams, useRouter } from "next/navigation";

//Zod
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

//Components
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

//API
import { getUsuarioById, updateUsuario } from "@/app/api/usuarios/action";
import { updateUsuarioSchema } from "@/app/api/usuarios/schema/formShemaUpdateUsuario";
//Helpers
import { SistemaComGrupos } from "@/app/types/Usuario";
//Types
import { http } from "@/util/http";

export default function EditarUsuario() {
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
  const [carregando, setCarregando] = useState(false);
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
              grupoIds: gruposSelecionados,
            });
            setIsFormReset(true);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      }
    }

    async function fetchSistemas() {
      setCarregando(true);
      try {
        const { data } = await http.get("/sistemas");
        setSistemas(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erro ao carregar sistemas:", error);
      } finally {
        setCarregando(false);
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
    resolver: zodResolver(updateUsuarioSchema),
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

  const onSubmit = async (values: z.infer<typeof updateUsuarioSchema>) => {
    setLoading(true);
    try {
      if (!userId) redirect("/painel/usuarios");
      await updateUsuario(userId, values);
      const queryParams = new URLSearchParams();

      queryParams.set("type", "success");
      queryParams.set("message", "Usuário atualizado com sucesso!");

      router.push(`/painel/usuarios?${queryParams.toString()}`);
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

      {carregando ? (
        <div className="flex justify-center items-center w-full h-40">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Carregando ...</span>
        </div>
      ) : (
        <Form {...form}>
          <h1 className="text-2xl font-bold mb-4 mt-5">Editar Usuário</h1>
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

            <h1 className="text-lg font-bold mb-4 mt-5">Definir Credenciais</h1>

            <div className="space-y-4">
              {sistemas.map((sistema) => (
                <div key={sistema.id} className="border p-4 rounded-md">
                  <h3 className="font-bold mb-2">{sistema.nome}</h3>

                  <FormField
                    control={form.control}
                    name={`grupoIds.${sistema.id}`}
                    render={({ field }) => (
                      <RadioGroup
                        value={field.value?.toString() || ""}
                        onValueChange={(value) => {
                          field.onChange(Number(value)); // Atualiza o form
                          handleGroupChange(sistema.id, Number(value)); // Atualiza estado local (se você ainda precisar disso)
                        }}
                        className="space-y-2"
                      >
                        {sistema.grupos.map((grupo) => (
                          <FormItem
                            key={grupo.id}
                            className="flex items-center space-x-2"
                          >
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
                        ))}
                      </RadioGroup>
                    )}
                  />
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
      )}
    </div>
  );
}
