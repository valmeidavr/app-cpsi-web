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
  grupoIds?: any;
  confirmedsenha: string;
};
type updateUsuariosPayload = {
  nome?: string;
  email?: string;
  senha?: string;
  grupoIds?: any;
  confirmedsenha?: string;
};
export async function createUsuario({
  nome,
  email,
  senha,
  confirmedsenha,
  grupoIds,
}: createUsuariosPayload) {
  try {
     grupoIds = Object.values(grupoIds);
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

export async function getUsuarioById(id: string) {
  const { data } = await httpServer.get(`/users/${id}`);
  return data;
}

export async function updateUsuario(id: string, body: updateUsuariosPayload) {
  try {
    body.grupoIds = Object.values(body.grupoIds);
    const { data } = await httpServer.patch(
      `/users/${id}`,
      body
    );
    revalidatePath("painel/usuarios?status=success");
    return data;
  } catch (error) {
    console.error("Erro no update:", error);
    return {
      message: "Não foi possível fazer o update do Usuario",
      error: true,
    };
  }
}

export async function deleteUsuario(id: number) {
  try {
    const response = await httpServer.delete(
      `/users/${id}`
    );
    revalidatePath("painel/usuarios");
  } catch {
    return {
      message: "Não foi possível deletar o Usuario",
      error: true,
    };
  }
}
