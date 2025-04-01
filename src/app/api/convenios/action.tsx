"use server";

import { http } from "@/util/http";
import { revalidatePath } from "next/cache";
import { toast } from "sonner";

export async function getConvenios(
  page: number = 1,
  limit: number = 5,
  search?: string
) {
  const { data } = await http.get("/convenios", {
    params: { page, limit, search },
  });
  return data;
}

type createConvenioPayload = {
  nome: string;
  regras: string;
  tabelaFaturamentosId: number
 
};
type updateConvenioPayload = {
  nome: string;
  regras: string;
  tabelaFaturamentosId: number
 
};
export async function createConvenio({
  nome,
  regras,
  tabelaFaturamentosId

}: createConvenioPayload) {
  try {
    await http.post("/convenios", {
      nome,
      regras,
      tabelaFaturamentosId
    
    });
    revalidatePath("/painel/convenios");
  } catch (error: any) {
    console.error("Erro ao criar convenio:", error);
    toast.error(
      error.response?.data?.message || "Erro ao criar convenio."
    );
  }
}

export async function getConvenioById(id: string) {
  const { data } = await http.get(`/convenios/${id}`);
  return data;
}

export async function updateConvenio(
  id: string,
  body: updateConvenioPayload
) {

  try {
    const { data } = await http.patch(
      `/convenios/${id}`,
      body
    );
    revalidatePath("painel/convenios?status=success");
    return data;
  } catch (error) {
    console.error("Erro no update:", error);
    return {
      message: "Não foi possível fazer o update da Convenio",
      error: true,
    };
  }
}

export async function deleteConvenio(id: number) {
  try {
    const response = await http.delete(
      `/convenios/${id}`
    );
    revalidatePath("painel/convenios");
  } catch {
    return {
      message: "Não foi possível deletar a Convenio",
      error: true,
    };
  }
}
