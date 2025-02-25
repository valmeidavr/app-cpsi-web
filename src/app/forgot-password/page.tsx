import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, ArrowRight, ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-r from-gray-100 to-gray-300 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/logotipo.svg?height=100&width=200"
              alt="GRUPO AAP-VR"
              width={200}
              height={100}
              className="rounded-md"
            />
          </div>
          <CardTitle className="text-2xl font-bold">
            Esqueceu sua senha?
          </CardTitle>
          <CardDescription>
            Digite seu email para receber um link de redefinição de senha
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input type="email" placeholder="Email" className="pl-10" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button className="w-full">
            <ArrowRight className="mr-2 h-4 w-4" /> Enviar link de redefinição
          </Button>
          <div className="text-sm text-center">
            <Link
              href="/"
              className="text-blue-500 hover:underline flex items-center justify-center"
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> Voltar para o login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </main>
  );
}
