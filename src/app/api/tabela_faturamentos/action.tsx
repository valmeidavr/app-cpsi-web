"use server";

import { http } from "@/util/http";
import { revalidatePath } from "next/cache";
import { toast } from "sonner";

export async function getTabelaFaturamentos(
  page: number = 1,
  limit: number = 5,
  search?: string
) {
  const { data } = await http.get("/tabela-faturamentos", {
    params: { page, limit, search },
  });
  return data;
}

type createTabelaFaturamentoPayload = {
  nome: string;
 
};
type updateTabelaFaturamentoPayload = {
  nome: string;
 
};
export async function createTabelaFaturamento({
  nome
}: createTabelaFaturamentoPayload) {
  try {
    await http.post("/tabela-faturamentos", {
      nome
    });
    revalidatePath("/painel/tabela-faturamentos");
  } catch (error: any) {
    console.error("Erro ao criar especialidade:", error);
    toast.error(
      error.response?.data?.message || "Erro ao criar especialidade."
    );
  }
}

export async function getTabelaFaturamentoById(id: string) {
  const { data } = await http.get(`/tabela-faturamentos/${id}`);
  return data;
}

export async function updateTabelaFaturamento(
  id: string,
  body: updateTabelaFaturamentoPayload
) {

  try {
    const { data } = await http.patch(
      `/tabela-faturamentos/${id}`,
      body
    );
    revalidatePath("painel/tabela-faturamentos?status=success");
    return data;
  } catch (error) {
    console.error("Erro no update:", error);
    return {
      message: "Não foi possível fazer o update da TabelaFaturamento",
      error: true,
    };
  }
}

export async function deleteTabelaFaturamento(id: number) {
  try {
    const response = await http.delete(
      `/tabela-faturamentos/${id}`
    );
    revalidatePath("painel/tabela-faturamentos");
  } catch {
    return {
      message: "Não foi possível deletar a TabelaFaturamento",
      error: true,
    };
  }
}
