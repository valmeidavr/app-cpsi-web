"use server";

import { http } from "@/util/http";
import { revalidatePath } from "next/cache";
import { toast } from "sonner";
import { z } from "zod";
import { formSchema } from "./schema/formSchemaPretadores";

export async function getPrestadors(
  page: number = 1,
  limit: number = 5,
  search?: string
) {
  const { data } = await http.get("/prestadores", {
    params: { page, limit, search },
  });
  return data;
}

export type PrestadorDTO = z.infer<typeof formSchema>;
export type updatePrestadorPayload = {
  nome: string;
  codigo: string;
  tipo: string;
  especialidadeId: number;
};
export async function createPrestador(body: PrestadorDTO) {
  try {
    const { data } = await http.post("/prestadores", {
      body,
    });
    revalidatePath("/painel/prestadores");
  } catch (error: any) {
    console.error("Erro ao criar prestador:", error);
  }
}

export async function getPrestadorById(id: string) {
  const { data } = await http.get(`/prestadores/${id}`);
  return data;
}

export async function updatePrestador(
  id: string,
  body: updatePrestadorPayload
) {
  try {
    const { data } = await http.patch(`/prestadores/${id}`, body);
    revalidatePath("painel/prestadores");
    return data;
  } catch (error) {
    console.error("Erro no update:", error);
    return {
      message: "Não foi possível fazer o update do Prestador",
      error: true,
    };
  }
}

export async function deletePrestador(id: number) {
  try {
    const response = await http.delete(`/prestadores/${id}`);
    revalidatePath("painel/prestadores");
  } catch {
    return {
      message: "Não foi possível inativar o prestador",
      error: true,
    };
  }
}
