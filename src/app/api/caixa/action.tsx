"use server";

import { http } from "@/util/http";
import { revalidatePath } from "next/cache";
import { toast } from "sonner";
import { z } from "zod";
import { createCaixaSchema, updateCaixaSchema } from "./schema/formSchemaCaixa";

export async function getCaixa(
  page: number = 1,
  limit: number = 5,
  search?: string
) {
  const { data } = await http.get("https://api-cpsi.aapvr.com.br//caixas", {
    params: { page, limit, search },
  });
  return data;
}

export type CreateCaixaDTO = z.infer<typeof createCaixaSchema>;
export type UpdateCaixaDTO = z.infer<typeof updateCaixaSchema>;

export async function createCaixa({ nome, saldo, tipo }: CreateCaixaDTO) {
  try {
    await http.post("https://api-cpsi.aapvr.com.br//caixas", {
      nome,
      saldo,
      tipo,
    });
    revalidatePath("/painel/caixa");
  } catch (error: any) {
    console.error("Erro ao criar caixa:", error);
    toast.error(error.response?.data?.message || "Erro ao criar caixa.");
  }
}

export async function getCaixaById(id: string) {
  const { data } = await http.get(`https://api-cpsi.aapvr.com.br//caixas/${id}`);
  return data;
}

export async function updateCaixa(id: string, body: UpdateCaixaDTO) {
  try {
    const { data } = await http.patch(
      `https://api-cpsi.aapvr.com.br//caixas/${id}`,
      body
    );
    revalidatePath("painel/caixa?status=success");
    return data;
  } catch (error) {
    console.error("Erro no update:", error);
    return {
      message: "Não foi possível fazer o update de Caixa",
      error: true,
    };
  }
}

export async function deleteCaixa(id: number) {
  try {
    const response = await http.delete(`https://api-cpsi.aapvr.com.br//caixas/${id}`);
    revalidatePath("painel/caixa");
  } catch {
    return {
      message: "Não foi possível deletar o Caixa",
      error: true,
    };
  }
}
