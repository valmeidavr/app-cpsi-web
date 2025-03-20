"use server";

import { httpServer } from "@/util/httpServer";
import { revalidatePath } from "next/cache";
import { toast } from "sonner";

export async function getUsuarios() {
  const { data } = await httpServer.get("/users");
  return data;
}

type createUsuariosPayload = {
  nome: string;
  email: string;
  senha: string;
  sistema: any;
  confirmedsenha: string;
};

export async function createUsuario({
  nome,
  email,
  senha,
  confirmedsenha,
  sistema,
}: createUsuariosPayload) {
  try {
    const grupoIds = Object.values(sistema);
    console.log(nome, email, senha, confirmedsenha, grupoIds);
    await httpServer.post("/users", {
      nome,
      email,
      senha,
      grupoIds,
    });
    revalidatePath("/painel/usuarios"); 
  } catch (error: any) {
    console.error("Erro ao criar usuarios:", error);
    toast.error(error.response?.data?.message || "Erro ao criar usuarios.");
  }
}
