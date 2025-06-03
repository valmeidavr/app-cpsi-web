"use server";

import { http } from "@/util/http";
import { revalidatePath } from "next/cache";
import { toast } from "sonner";
import { z } from "zod";
import {
  createPlanosSchema,
  updatePlanosSchema,
} from "./schema/formSchemaPlanos";

export async function getPlanos(
  page: number = 1,
  limit: number = 5,
  search?: string
) {
  const { data } = await http.get("https://api-cpsi.aapvr.com.br//plano-contas", {
    params: { page, limit, search },
  });
  return data;
}

export type CreatePlanoDTO = z.infer<typeof createPlanosSchema>;
export type UpdatePlanoDTO = z.infer<typeof updatePlanosSchema>;

export async function createPlano({
  nome,
  tipo,
  categoria,
  descricao,
}: CreatePlanoDTO) {
  try {
    await http.post("https://api-cpsi.aapvr.com.br//plano-contas", {
      nome,
      tipo,
      categoria,
      descricao,
    });
    revalidatePath("/painel/plano_contas");
  } catch (error: any) {
    console.error("Erro ao criar plano:", error);
    toast.error(error.response?.data?.message || "Erro ao criar plano.");
  }
}

export async function getPlanoById(id: string) {
  const { data } = await http.get(`https://api-cpsi.aapvr.com.br//plano-contas/${id}`);
  return data;
}

export async function updatePlano(id: string, body: UpdatePlanoDTO) {
  try {
    const { data } = await http.patch(
      `https://api-cpsi.aapvr.com.br//plano-contas/${id}`,
      body
    );
    revalidatePath("painel/plano_contas?status=success");
    return data;
  } catch (error) {
    console.error("Erro no update:", error);
    return {
      message: "Não foi possível fazer o update do Plano",
      error: true,
    };
  }
}

export async function deletePlano(id: number) {
  try {
    const response = await http.delete(
      `https://api-cpsi.aapvr.com.br//plano-contas/${id}`
    );
    revalidatePath("painel/plano_contas");
  } catch {
    return {
      message: "Não foi possível deletar o Plano",
      error: true,
    };
  }
}
