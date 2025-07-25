"use server";

import { http } from "@/util/http";
import { revalidatePath } from "next/cache";
import { toast } from "sonner";
import { z } from "zod";
import {
  createProcedimentoSchema,
  updateProcedimentoSchema,
} from "./schema/formSchemaProcedimentos";

export async function getProcedimentos(
  page: number = 1,
  limit: number = 5,
  search?: string
) {
  const { data } = await http.get("/procedimentos", {
    params: { page, limit, search },
  });
  return data;
}

export type CreateProcedimentoDTO = z.infer<typeof createProcedimentoSchema>;
export type UpdateProcedimentoDTO = z.infer<typeof updateProcedimentoSchema>;
export async function createProcedimento(body: CreateProcedimentoDTO) {
  try {
    await http.post("/procedimentos", body);
    revalidatePath("/painel/procedimentos");
  } catch (error: any) {
    console.error("Erro ao criar procedimento:", error);
  }
}

export async function getProcedimentoById(id: string) {
  const { data } = await http.get(`/procedimentos/${id}`);
  return data;
}

export async function updateProcedimento(
  id: string,
  body: UpdateProcedimentoDTO
) {
  try {
    const { data } = await http.patch(`/procedimentos/${id}`, body);
    revalidatePath("painel/procedimentos");
    return data;
  } catch (error) {
    console.error("Erro no update:", error);
    return {
      message: "Não foi possível fazer o update do Procedimento",
      error: true,
    };
  }
}

export async function deleteProcedimento(id: number) {
  try {
    const response = await http.delete(`/procedimentos/${id}`);
    revalidatePath("painel/procedimentos");
  } catch {
    return {
      message: "Não foi possível inativar o procedimento",
      error: true,
    };
  }
}
