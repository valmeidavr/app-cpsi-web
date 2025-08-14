"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PainelHome() {
  const { session, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Se não estiver autenticado e não estiver carregando, redirecionar para login
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, não mostrar nada (será redirecionado)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      <h3 className="text-2xl font-bold mb-4">
        Seja bem-vindo <strong>{session?.user?.name || "Usuário"}</strong>
      </h3>
      <p className="text-gray-600">Selecione uma opção no menu lateral para começar.</p>
    </div>
  );
}
