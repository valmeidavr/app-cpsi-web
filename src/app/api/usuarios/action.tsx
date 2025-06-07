"use server";

import { http } from "@/util/http";
import { revalidatePath } from "next/cache";
import { toast } from "sonner";
import { z } from "zod";
import { createUsuarioSchema } from "./schema/formSchemaUsuarios";
import { updateUsuarioSchema } from "./schema/formShemaUpdateUsuario";

export async function getUsuarios() {
  const { data } = await http.get("/users");
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

export type CreateUsuarioDTO = z.infer<typeof createUsuarioSchema>;
export type UpdateUsuarioDTO = z.infer<typeof updateUsuarioSchema>;
export async function createUsuario({
  nome,
  email,
  senha,
  confirmedsenha,
  grupoIds,
}: CreateUsuarioDTO) {
  try {
    const gruposIds = grupoIds ? Object.values(grupoIds) : [];
    const data = await http.post("/users", {
      nome,
      email,
      senha,
      grupoIds: gruposIds,
    });
    revalidatePath("/painel/usuarios");
  } catch (error: any) {
    console.error("Erro ao criar usuarios:", error);
  }
}

export async function getUsuarioById(id: string) {
  const { data } = await http.get(`/users/${id}`);
  return data;
}

export async function updateUsuario(id: string, body: updateUsuariosPayload) {
  try {
    body.grupoIds = Object.values(body.grupoIds);
    const { data } = await http.patch(`/users/${id}`, body);
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
    const response = await http.delete(`/users/${id}`);
    revalidatePath("painel/usuarios");
  } catch {
    return {
      message: "Não foi possível deletar o Usuario",
      error: true,
    };
  }
}
