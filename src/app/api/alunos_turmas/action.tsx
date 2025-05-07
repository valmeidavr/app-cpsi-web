"use server";
import { http } from "@/util/http";
import { revalidatePath } from "next/cache";
import { Aluno } from "@/app/types/Aluno";

type alunosTurma = Omit<
  Aluno,
  "id" | "createdAt" | "updatedAt" | "turma" | "cliente"
>;

export async function createAlunosTurma(body: alunosTurma) {
  try {
    await http.post("http://localhost:3000/alunos-turmas", body);
    revalidatePath("/painel/turmas/adicionar_alunos_modal");
  } catch (error: any) {
    console.error("Erro ao criar alunosTurma:", error);
  }
}

export async function getalunosTurma(
  page: number = 1,
  limit: number = 10,
  search?: string
) {
  const { data } = await http.get("/alunos-turmas", {
    params: { page, limit, search },
  });

  return data;
}

export async function getalunosTurmaById(id: number): Promise<Aluno> {
  const { data } = await http.get(`http://localhost:3000/alunos-turmas/${id}`);

  return data;
}

export async function updatealunosTurma(id: string, body: Aluno) {
  try {
    await http.patch(`/alunos-turmas/${id}`, body);
    revalidatePath("painel/alunosTurma");
  } catch (error) {
    return {
      message: "Não foi possível fazer o update do alunosTurma",
      error: true,
    };
  }
}

export async function deleteAlunoTurma(id: number): Promise<void> {
  try {
    await http.delete(`http://localhost:3000/alunos-turmas/${id}`);
    revalidatePath("painel/alunosTurma/adicionar_alunos_modal");
  } catch (error) {
    console.error("Erro ao deletar aluno:", error);
  }
}
export async function deleteAllAlunoTurma(id: number): Promise<void> {
  try {
    await http.delete(`http://localhost:3000/alunos-turmas/deleteAll`, {
      params: {
        turmasId: id,
      },
    });
    revalidatePath("painel/alunosTurma/adicionar_alunos_modal");
  } catch (error) {
    console.error("Erro ao deletar aluno:", error);
  }
}
