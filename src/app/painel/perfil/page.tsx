"use client";

//React
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
//Zod
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
//Components (adicionando os novos)
import { Button } from "@/components/ui/button";
import { Save, Loader2, Eye, EyeOff, UserCircle2 } from "lucide-react";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

//API
import { createUsuario } from "@/app/api/usuarios/action";
import { createUsuarioSchema } from "@/app/api/usuarios/schema/formSchemaUsuarios";
//Helpers
import { http } from "@/util/http";
import { getCookie } from "@/util/cookies";
import { getPayload } from "@/util/auth";
import { Usuario } from "@/app/types/Usuario";

export default function UsuarioProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [usuario, setUsuario] = useState<Partial<Usuario> | null>(null);
  const [carregando, setCarregando] = useState(true); // Inicia como true

  const form = useForm({
    resolver: zodResolver(createUsuarioSchema),
    mode: "onChange",
    defaultValues: {
      nome: "",
      email: "",
      senha: "",
      confirmedsenha: "",
    },
  });

  useEffect(() => {
    setCarregando(true);
    const token = getCookie("accessToken");
    if (token) {
      const payload = getPayload(token);
      const userData = payload?.usuario;

      if (userData) {
        setUsuario(userData);
        form.reset({
          nome: userData.nome,
          email: userData.email,
          senha: "",
          confirmedsenha: "",
        });
      }
    }
    setCarregando(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword((prev) => !prev);

  const onSubmit = async (values: z.infer<typeof createUsuarioSchema>) => {
    setLoading(true);
    if (emailError) {
      toast.error("Corrija os erros antes de enviar o formulário.");
      setLoading(false);
      return;
    }
    try {
      await createUsuario(values);
      toast.success("Perfil atualizado com sucesso!");
      // Opcional: redirecionar ou apenas mostrar a mensagem
      // router.push(`/painel/`);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Erro ao salvar usuário";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Funções checkEmail e handleEmailChange permanecem as mesmas...
  const checkEmail = async (email: string) => {
    if (!email || email === usuario?.email) {
      setEmailError(null);
      return;
    }
    setIsCheckingEmail(true);
    try {
      const { data } = await http.get(`/users/findByEmail/${email}`);
      if (data) {
        setEmailError("Este email já está em uso.");
      } else {
        setEmailError(null);
      }
    } catch (error) {
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

  if (carregando) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Perfil do Usuário" },
        ]}
      />

      {/* Cabeçalho da Página */}
      <div className="my-8">
        <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie suas informações pessoais e de segurança.
        </p>
      </div>

      <Form {...form}>
        <form
          id="profile-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8"
        >
          {/* Card de Informações Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>
                Atualize seu nome e e-mail .
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {usuario?.nome ? (
                      usuario.nome.charAt(0).toUpperCase()
                    ) : (
                      <UserCircle2 />
                    )}
                  </AvatarFallback>
                </Avatar>
                <p className="font-medium">{usuario?.nome}</p>
              </div>
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
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
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        {...field}
                        onChange={handleEmailChange}
                      />
                    </FormControl>
                    {isCheckingEmail && (
                      <p className="text-sm text-muted-foreground">
                        Verificando email...
                      </p>
                    )}
                    {emailError && (
                      <p className="text-sm text-destructive">{emailError}</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Card de Segurança */}
          <Card>
            <CardHeader>
              <CardTitle>Segurança</CardTitle>
              <CardDescription>
                Para alterar sua senha, preencha os campos abaixo. Deixe em
                branco para manter a senha atual.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="senha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            autoComplete="new-password"
                            type={showPassword ? "text" : "password"}
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 absolute right-1 top-1/2 transform -translate-y-1/2 text-muted-foreground"
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmedsenha"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Nova Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 absolute right-1 top-1/2 transform -translate-y-1/2 text-muted-foreground"
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botão de Ação */}
          <div className="flex justify-end">
            <Button type="submit" disabled={loading} size="lg">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
