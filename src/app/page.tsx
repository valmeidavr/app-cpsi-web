"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { http } from "@/util/http";
import { setCookie } from "@/util/cookies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, Lock, LogIn, Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setErrorMessage(null);
    setLoading(true);
  
    try {
      const { data } = await http.post("auth/login", { email, senha });
      const user = data.usuario;
      const cpsiSystem = user.sistemas.find((sistema: any) => sistema.nome === "CPSI");
  
      if (!cpsiSystem) {
        setErrorMessage("Acesso negado. Você não tem permissão para acessar este sistema.");
        setLoading(false);
        return;
      }
  
      // 🔥 SALVANDO OS COOKIES CORRETAMENTE
      setCookie("accessToken", data.access_token, { path: "/" });
      setCookie("userGroups", JSON.stringify(cpsiSystem.grupos), { path: "/" });
      
      console.log("✅ Login bem-sucedido! Redirecionando para o painel...");
      router.replace("/painel");
    } catch (err: any) {
      setErrorMessage(err.response?.status === 401 ? "Não autorizado. Verifique suas credenciais." : "Usuário e/ou senha inválido.");
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-r from-gray-100 to-gray-300 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Image src="/logotipo.svg" alt="GRUPO AAP-VR" width={200} height={100} className="rounded-md" />
          </div>
          <CardTitle className="text-2xl font-bold">Bem-vindo de volta</CardTitle>
          <CardDescription>Entre com suas credenciais para acessar sua conta</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input type="email" placeholder="Email" className="pl-10" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input type="password" placeholder="Senha" className="pl-10" required value={senha} onChange={(e) => setSenha(e.target.value)} />
              </div>
            </div>
            {errorMessage && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Erro ao fazer login</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="animate-spin h-4 w-4" />
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" /> Entrar
                </>
              )}
            </Button>
            <div className="text-sm text-center">
              <Link href="/forgot-password" className="text-blue-500 hover:underline">
                Esqueceu sua senha?
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
