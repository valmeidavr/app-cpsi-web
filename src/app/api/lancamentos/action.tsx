"use server";

import { http } from "@/util/http";
import { format, isValid, parse } from "date-fns";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createLancamentoSchema,
  updateLancamentoSchema,
} from "./schema/formSchemeLancamentos";

export async function getLancamentos(
  page: number = 1,
  limit: number = 5,
  search?: string
) {
  const { data } = await http.get("/lancamentos", {
    params: { page, limit, search },
  });
  return data;
}

export type CreateLancamentoDTO = z.infer<typeof createLancamentoSchema>;
export type UpdateLancamentoDTO = z.infer<typeof updateLancamentoSchema>;

export async function createLancamento(body: CreateLancamentoDTO) {
  try {
    if (body.data_lancamento) {
      const parsedDate = parse(body.data_lancamento, "yyyy-MM-dd", new Date());

      if (isValid(parsedDate)) {
        body.data_lancamento = format(parsedDate, "yyyy-MM-dd");
      } else {
        console.error("Data de lançamento inválida:", body.data_lancamento);
      }
    }
    await http.post("/lancamentos", body);
    revalidatePath("/painel/lancamentos");
  } catch (error: any) {
    console.error("Erro ao criar lancamento:", error);
  }
}

export async function getLancamentoById(id: string) {
  const { data } = await http.get(
    `/lancamentos/${id}`
  );
  return data;
}
export async function getLancamentoByAgendaId(id: string) {
  const { data } = await http.get(
    `/lancamentos/findByAgendaId/${id}`
  );
  console.log("Dados do lançamento por agenda:", data);
  return data;
}

export async function updateLancamento(id: string, body: UpdateLancamentoDTO) {
  try {
    const { data } = await http.patch(
      `/lancamentos/${id}`,
      body
    );
    revalidatePath("painel/lancamentos");
    return data;
  } catch (error) {
    console.error("Erro no update:", error);
    return {
      message: "Não foi possível fazer o update do Lancamento",
      error: true,
    };
  }
}

export async function deleteLancamento(id: number) {
  try {
    const response = await http.delete(`/lancamentos/${id}`);
    revalidatePath("painel/lancamentos");
  } catch {
    return {
      message: "Não foi possível inativar o lancamento",
      error: true,
    };
  }
}

export async function updateStatusLancamento(id: number, status: string) {
  try {
    console.log(status)
    const response = await http.patch(`/lancamentos/${id}`, { status });
    console.log(response)
    revalidatePath("painel/lancamentos");
  } catch {
    return {
      message: `Não foi possível alterar o status para ${status} do lançamento`,
      error: true,
    };
  }
}
