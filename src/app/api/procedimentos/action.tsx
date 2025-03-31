"use server";

import { httpServer } from "@/util/httpServer";
import { revalidatePath } from "next/cache";
import { toast } from "sonner";

export async function getProcedimentos(
  page: number = 1,
  limit: number = 5,
  search?: string
) {
  const { data } = await httpServer.get("http://localhost:3000/procedimentos", {
    params: { page, limit, search },
  });
  return data;
}

type createProcedimentoPayload = {
  nome: string;
  codigo: string;
  tipo: string;
  especialidadeId: number
};
export type updateProcedimentoPayload = {
  nome: string;
  codigo: string;
  tipo: string;
  especialidadeId: number;
};
export async function createProcedimento({
  nome,
  codigo,
  tipo,
  especialidadeId
}: createProcedimentoPayload) {
  console.log("body", nome, codigo, tipo, especialidadeId);
  try {
    const { data } = await httpServer.post("http://localhost:3000/procedimentos", {
      nome,
      codigo,
      tipo,
      especialidadeId,
    });
    console.log("response:", data)
    revalidatePath("/painel/procedimentos");
  } catch (error: any) {
    console.error("Erro ao criar procedimento:", error);
  }
}

export async function getProcedimentoById(id: string) {
  const { data } = await httpServer.get(
    `http://localhost:3000/procedimentos/${id}`
  );
  return data;
}

export async function updateProcedimento(
  id: string,
  body: updateProcedimentoPayload
) {
  console.log("body",body);
  try {
    const { data } = await httpServer.patch(
      `http://localhost:3000/procedimentos/${id}`,
      body
    );
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
    const response = await httpServer.delete(`/procedimentos/${id}`);
    revalidatePath("painel/procedimentos");
  } catch {
    return {
      message: "Não foi possível inativar o procedimento",
      error: true,
    };
  }
}
