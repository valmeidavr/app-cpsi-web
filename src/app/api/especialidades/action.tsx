"use server";

import { http } from "@/util/http";
import { httpServer } from "@/util/httpServer";
import { revalidatePath } from "next/cache";
import { toast } from "sonner";

export async function getEspecialidades(
  page: number = 1,
  limit: number = 5,
  search?: string
) {
  const { data } = await httpServer.get("http://localhost:3000/especialidades", {
    params: { page, limit, search },
  });
  console.log("especialidades", data);
  return data;
}

type createEspecialidadePayload = {
  nome: string;
  codigo: string;
};
type updateEspecialidadePayload = {
  nome: string;
  codigo: string;
};
export async function createEspecialidade({
  nome,
  codigo,
}: createEspecialidadePayload) {
  console.log("body", nome, codigo);
  try {
    await httpServer.post("/especialidades", {
      nome,
      codigo,
    });
    revalidatePath("/painel/especialidades");
  } catch (error: any) {
    console.error("Erro ao criar especialidade:", error);
    toast.error(
      error.response?.data?.message || "Erro ao criar especialidade."
    );
  }
}

export async function getEspecialidadeById(id: string) {
  const { data } = await http.get(`/especialidades/${id}`);
  return data;
}

export async function updateEspecialidade(
  id: string,
  body: updateEspecialidadePayload
) {
  console.log(body);
  try {
    const { data } = await httpServer.patch(
      `/especialidades/${id}`,
      body
    );
    revalidatePath("painel/especialidades?status=success");
    return data;
  } catch (error) {
    console.error("Erro no update:", error);
    return {
      message: "Não foi possível fazer o update da Especialidade",
      error: true,
    };
  }
}

export async function deleteEspecialidade(id: number) {
  try {
    const response = await http.delete(
      `/especialidades/${id}`
    );
    revalidatePath("painel/especialidades");
  } catch {
    return {
      message: "Não foi possível deletar a Especialidade",
      error: true,
    };
  }
}
