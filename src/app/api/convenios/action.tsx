"use server";

import { http } from "@/util/http";
import { revalidatePath } from "next/cache";
import { toast } from "sonner";
import { z } from "zod";
import {
  createConvenioSchema,
  updateConvenioSchema,
} from "./schema/formSchemaConvenios";

export async function getConvenios(
  page: number = 1,
  limit: number = 5,
  search?: string
) {
  const { data } = await http.get("https://api-cpsi.aapvr.com.br//convenios", {
    params: { page, limit, search },
  });
  return data;
}

export type CreateConvenioDTO = z.infer<typeof createConvenioSchema>;
export type UpdateConvenioDTO = z.infer<typeof updateConvenioSchema>;
export async function createConvenio(body: CreateConvenioDTO) {
  try {
    await http.post("https://api-cpsi.aapvr.com.br//convenios", body);
    revalidatePath("/painel/convenios");
  } catch (error: any) {
    console.error("Erro ao criar convenio:", error);
    toast.error(error.response?.data?.message || "Erro ao criar convenio.");
  }
}

export async function getConvenioById(id: string) {
  const { data } = await http.get(`/convenios/${id}`);
  return data;
}

export async function updateConvenio(id: string, body: UpdateConvenioDTO) {
  try {
    const { data } = await http.patch(
      `https://api-cpsi.aapvr.com.br//convenios/${id}`,
      body
    );
    revalidatePath("painel/convenios?status=success");
    return data;
  } catch (error) {
    console.error("Erro no update:", error);
    return {
      message: "Não foi possível fazer o update do Convênio",
      error: true,
    };
  }
}

export async function deleteConvenio(id: number) {
  try {
    const response = await http.delete(`/convenios/${id}`);
    revalidatePath("painel/convenios");
  } catch {
    return {
      message: "Não foi possível deletar o Convênio",
      error: true,
    };
  }
}
