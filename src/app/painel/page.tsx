"use client";

import { getCookie } from "@/util/cookies";
import { getPayload } from "@/util/auth"; // Função para decodificar o JWT
import { useState, useEffect } from "react";

export default function PainelHome() {
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    try {
      const accessToken = getCookie("accessToken"); // Pega o JWT do cookie

      if (accessToken) {
        const payload = getPayload(accessToken); // Decodifica o JWT
        // Obtém o nome do usuário corretamente
        setUserName(payload?.usuario?.nome || "Usuário");
      }
    } catch (error) {
      console.error("Erro ao obter nome do usuário:", error);
    }
  }, []);

  return (
    <div>
      <h3 className="text-2xl font-bold mb-4">
        Seja bem-vindo <strong>{userName || "Usuário"}</strong>
      </h3>
      <p className="text-gray-600">Selecione uma opção no menu lateral para começar.</p>
    </div>
  );
}
