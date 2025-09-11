"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft, Lock } from "lucide-react";
export default function AcessoNegado() {
  const router = useRouter();
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-r from-gray-100 to-gray-300 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">
            Acesso Negado
          </CardTitle>
          <CardDescription className="text-gray-600">
            Você não tem permissão para acessar esta área do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Possíveis motivos:</p>
                <ul className="mt-2 space-y-1">
                  <li>• Você não está logado no sistema</li>
                  <li>• Sua conta não tem permissão para esta área</li>
                  <li>• Sua sessão expirou</li>
                  <li>• Você não tem acesso ao sistema prevSaúde</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="flex flex-col space-y-3">
            <Button 
              onClick={() => router.push("/")} 
              className="w-full"
              variant="default"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para o Login
            </Button>
            <Button 
              onClick={() => router.back()} 
              className="w-full"
              variant="outline"
            >
              Voltar à Página Anterior
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
} 