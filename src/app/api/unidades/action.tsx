"use server";

import { http } from "@/util/http";
import { revalidatePath } from "next/cache";
import { toast } from "sonner";

export async function getUnidades(
  page: number = 1,
  limit: number = 5,
  search?: string
) {
  const { data } = await http.get("/unidades", {
    params: { page, limit, search },
  });
  return data;
}

type createUnidadePayload = {
  nome: string;
};
type updateUnidadePayload = {
  nome: string;
};
export async function createUnidade({ nome }: createUnidadePayload) {
  try {
    await http.post("/unidades", {
      nome,
    });
    revalidatePath("/painel/unidades");
  } catch (error: any) {
    console.error("Erro ao criar unidade:", error);
    toast.error(error.response?.data?.message || "Erro ao criar unidade.");
  }
}

export async function getUnidadeById(id: string) {
  const { data } = await http.get(`/unidades/${id}`);
  return data;
}

export async function updateUnidade(id: string, body: updateUnidadePayload) {
  try {
    const { data } = await http.patch(`/unidades/${id}`, body);
    revalidatePath("painel/unidades?status=success");
    return data;
  } catch (error) {
    console.error("Erro no update:", error);
    return {
      message: "Não foi possível fazer o update da unidade",
      error: true,
    };
  }
}

export async function deleteUnidade(id: number) {
  try {
    const response = await http.delete(`/tabela-faturamentos/${id}`);
    revalidatePath("painel/unidades");
  } catch {
    return {
      message: "Não foi possível deletar a unidade",
      error: true,
    };
  }
}
