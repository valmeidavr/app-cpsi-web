"use server";


import { http } from "@/util/http";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createAlocacaoSchema,
  updateAlocacaoSchema,
} from "./shema/formSchemaAlocacao";
import { Alocacao } from "@/app/types/Alocacao";

export type CreateAlocacaoDTO = z.infer<typeof createAlocacaoSchema>;
export type UpdateAlocacaoDTO = z.infer<typeof updateAlocacaoSchema>;

export async function createAlocacao(body: CreateAlocacaoDTO) {
  try {
    await http.post("http://localhost:3000/alocacoes", body);
    revalidatePath("/painel/alocacoes");
  } catch (error: any) {
    console.error("Erro ao criar alocacao:", error);
  }
}

export async function getAlocacaos(
  page: number = 1,
  limit: number = 10,
  search?: string
) {
  const { data } = await http.get("http://localhost:3000/alocacoes", {
    params: { page, limit, search },
  });

  return data;
}

export async function getAlocacaoById(id: string): Promise<Alocacao> {
  const { data } = await http.get(`http://localhost:3000/alocacoes/${id}`);

  return data;
}

export async function updateAlocacao(id: string, body: UpdateAlocacaoDTO) {
  try {
    await http.patch(`http://localhost:3000/alocacoes/${id}`, body);
    revalidatePath("painel/alocacoes");
  } catch (error) {
    return {
      message: "Não foi possível fazer o update do Alocacao",
      error: true,
    };
  }
}
