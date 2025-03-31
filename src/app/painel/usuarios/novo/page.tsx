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
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [sistemas, setSistemas] = useState<SistemaComGrupos[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    async function fetchSistemas() {
      try {
        const { data } = await http.get("/sistemas");
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    if (emailError) {
      toast.error("Corrija os erros antes de enviar o formulário.");
      return;
    }
    try {
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

    setLoading(false);
  };

  const checkEmail = async (email: string) => {
    if (!email) {
      setEmailError(null);
      return;
    }

    setIsCheckingEmail(true);
    try {
      const { data } = await http.get(
        `/users/findByEmail/${email}`
      );
      if (data) {
        setEmailError("Este email já está em uso.");
      } else {
        setEmailError(null);
      }
    } catch (error) {
      console.error("Erro ao verificar email:", error);
      setEmailError("Erro ao verificar email.");
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const email = event.target.value;
    form.setValue("email", email, { shouldValidate: true });

    if (timeoutId) clearTimeout(timeoutId);
    const newTimeoutId = setTimeout(() => checkEmail(email), 500);
    setTimeoutId(newTimeoutId);
  };
  return (
    <div className="container mx-auto">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Gerenciar Usuários", href: "/painel/usuarios" },
          { label: "Novo Usuário" },
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
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    {...field}
                    onChange={handleEmailChange}
                    className={`border ${
                      emailError || form.formState.errors.email
                        ? "border-red-500"
                        : "border-gray-300"
                    } focus:ring-2 focus:ring-primary`}
                  />
                </FormControl>
                {isCheckingEmail && (
                  <p className="text-gray-500 text-sm">Verificando email...</p>
                )}
                {emailError && (
                  <p className="text-red-500 text-sm">{emailError}</p>
                )}
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
                        type={showPassword ? "text" : "password"} // Alterna entre "password" e "text"
                        {...field}
                        className={`border ${
                          form.formState.errors.senha
                            ? "border-red-500"
                            : "border-gray-300"
                        } focus:ring-2 focus:ring-primary pr-10`} // Adiciona espaço para o ícone
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className=" h-8 w-8 absolute right-2 top-1/2 transform -translate-y-1/2" // Posiciona o ícone
                        onClick={togglePasswordVisibility}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" /> // Ícone para ocultar a senha
                        ) : (
                          <Eye className="h-4 w-4" /> // Ícone para mostrar a senha
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
                        type={showConfirmPassword ? "text" : "password"} // Alterna entre "password" e "text"
                        {...field}
                        className={`border ${
                          form.formState.errors.confirmedsenha
                            ? "border-red-500"
                            : "border-gray-300"
                        } focus:ring-2 focus:ring-primary pr-10`} // Adiciona espaço para o ícone
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className=" h-8 w-8 absolute right-2 top-1/2 transform -translate-y-1/2" // Posiciona o ícone
                        onClick={toggleConfirmPasswordVisibility}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" /> // Ícone para ocultar a senha
                        ) : (
                          <Eye className="h-4 w-4" /> // Ícone para mostrar a senha
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
                      name={`grupoIds.${sistema.id}`}
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
