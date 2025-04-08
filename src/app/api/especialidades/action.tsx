"use server";

import { http } from "@/util/http";
import { revalidatePath } from "next/cache";
import { toast } from "sonner";
import { z } from "zod";
import {
  createEspecialidadeSchema,
  updateEspecialidadeSchema,
} from "./schema/formSchemaEspecialidade";

export async function getEspecialidades(
  page: number = 1,
  limit: number = 5,
  search?: string
) {
  const { data } = await http.get("/especialidades", {
    params: { page, limit, search },
  });
  return data;
}
export type CreateEspecialidadeDTO = z.infer<typeof createEspecialidadeSchema>;
export type UpdateEspecialidadeDTO = z.infer<typeof updateEspecialidadeSchema>;

export async function createEspecialidade({ nome, codigo }: CreateEspecialidadeDTO) {
  try {
    await http.post("/especialidades", {
      nome,
      codigo,
    });
    revalidatePath("/painel/especialidades");
  } catch (error: any) {
    console.error("Erro ao criar especialidade:", error);
    toast.error(
      error.response?.data?.message || "Erro ao criar especialidade."
    );
  }
}

export async function getEspecialidadeById(id: string) {
  const { data } = await http.get(`/especialidades/${id}`);
  return data;
}

export async function updateEspecialidade(id: string, body: UpdateEspecialidadeDTO) {
  try {
    const { data } = await http.patch(`/especialidades/${id}`, body);
    revalidatePath("painel/especialidades?status=success");
    return data;
  } catch (error) {
    console.error("Erro no update:", error);
    return {
      message: "Não foi possível fazer o update da Especialidade",
      error: true,
    };
  }
}

export async function deleteEspecialidade(id: number) {
  try {
    const response = await http.delete(`/especialidades/${id}`);
    revalidatePath("painel/especialidades");
  } catch {
    return {
      message: "Não foi possível deletar a Especialidade",
      error: true,
    };
  }
}
