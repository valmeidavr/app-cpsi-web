"use server";

import { http } from "@/util/http";
import { revalidatePath } from "next/cache";


import { format, isValid, parse } from "date-fns";
import { createTurmaSchema, updateTurmaSchema } from "./schema/formSchemaTurmas";
import { z } from "zod";

export async function getTurmas(
  page: number = 1,
  limit: number = 5,
  search?: string
) {
  const { data } = await http.get("/turmas", {
    params: { page, limit, search },
  });
  return data;
}
export type CreateTurmaDTO = z.infer<typeof createTurmaSchema>;
export type UpdateTurmaDTO = z.infer<typeof updateTurmaSchema>;
export async function createTurma(body: CreateTurmaDTO) {
  if (body.dataInicio) {
    const dataInicio = parse(body.dataInicio, "dd/MM/yyyy", new Date());
    if (isValid(dataInicio)) {
      body.dataInicio = format(dataInicio, "yyyy-MM-dd");
    }
  }
  const { horarioInicio, horarioFim, ...restoDoBody } = body;

  const bodyFormatado = {
    ...restoDoBody,
    horario: `${horarioInicio} - ${horarioFim}`,
  };
  try {
    const { data } = await http.post(
      "/turmas",
      bodyFormatado
    );
    revalidatePath("/painel/turmas");
  } catch (error: any) {
    console.error("Erro ao criar turma:", error.message);
  }
}

export async function getTurmaById(id: number) {
  const { data } = await http.get(`/turmas/${id}`);

  return data;
}

export async function updateTurma(id: string, body: UpdateTurmaDTO) {
  if (body.dataInicio) {
    const dataInicio = parse(body.dataInicio, "dd/MM/yyyy", new Date());
    if (isValid(dataInicio)) {
      body.dataInicio = format(dataInicio, "yyyy-MM-dd");
    }
  }
  const { horarioInicio, horarioFim, ...restoDoBody } = body;

  const bodyFormatado = {
    ...restoDoBody,
    horario: `${horarioInicio} - ${horarioFim}`,
  };


  try {
    await http.patch(`/turmas/${id}`, bodyFormatado);
    revalidatePath("painel/turmas");
  } catch (error) {
    console.error("Erro no update:", error);
    return {
      message: "Não foi possível fazer o update do Turma",
      error: true,
    };
  }
}

export async function finalizarTurma(id: number, dataFim: string) {
  try {
    await http.patch(`/turmas/${id}`, {
      dataFim
    });
    revalidatePath("/painel/turmas");
  } catch (error) {
    console.error("Erro na requisição:", error);
    return {
      message: "Não foi possível inativar a turma",
      error: true,
    };
  }
}
