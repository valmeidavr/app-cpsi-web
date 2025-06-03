"use server";

import { http } from "@/util/http";
import { revalidatePath } from "next/cache";

import { format, isValid, parse } from "date-fns";

import { z } from "zod";
import {
  updateValorProcedimentoSchema,
  createValorProcedimentoSchema,
} from "./schema/formSchemaValorProcedimento";

export async function getValorProcedimentos(
  page: number = 1,
  limit: number = 5,
  search?: string
) {
  const { data } = await http.get(
    "https://api-cpsi.aapvr.com.br//valores-procedimentos",
    {
      params: { page, limit, search },
    }
  );
  return data;
}

export type CreateValorProcedimentoDTO = z.infer<
  typeof createValorProcedimentoSchema
>;
export type UpdateValorProcedimentoDTO = z.infer<
  typeof updateValorProcedimentoSchema
>;

export async function createValorProcedimento(
  body: CreateValorProcedimentoDTO
) {
  try {
    await http.post("https://api-cpsi.aapvr.com.br//valores-procedimentos", body);
    revalidatePath("/painel/valores_procedimentos");
  } catch (error: any) {
    console.error("Erro ao criar ValorProcedimento:", error.message);
  }
}

export async function getValorProcedimentoById(id: string) {
  const { data } = await http.get(
    `https://api-cpsi.aapvr.com.br//valores-procedimentos/${id}`
  );
  return data;
}

export async function updateValorProcedimento(
  id: number,
  body: UpdateValorProcedimentoDTO
) {
  try {
    await http.patch(`https://api-cpsi.aapvr.com.br//valores-procedimentos/${id}`, body);
    revalidatePath("/painel/valorProcedimentos");
  } catch (error) {
    console.error("Erro no update do ValorProcedimento:", error);
    return {
      message: "Não foi possível fazer o update do ValorProcedimento",
      error: true,
    };
  }
}

export async function finalizarValorProcedimento(id: number) {
  try {
    await http.delete(`https://api-cpsi.aapvr.com.br//valores-procedimentos/${id}`);
    revalidatePath("/painel/valorProcedimentos");
  } catch (error) {
    console.error("Erro ao deletar ValorProcedimento:", error);
    return {
      message: "Não foi possível excluir o ValorProcedimento",
      error: true,
    };
  }
}
