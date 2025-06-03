"use server";

import { http } from "@/util/http";
import { revalidatePath } from "next/cache";

import { format, isValid, parse } from "date-fns";

import { z } from "zod";
import {
  createExpedienteSchema,
  updateExpedienteSchema,
} from "./schema/formSchemaExpedientes";

export async function getExpedientes(
  page: number = 1,
  limit: number = 5,
  search?: string
) {
  const { data } = await http.get("https://api-cpsi.aapvr.com.br//expedientes", {
    params: { page, limit, search },
  });
  return data;
}
export type CreateExpedienteDTO = z.infer<typeof createExpedienteSchema>;
export type UpdateExpedienteDTO = z.infer<typeof updateExpedienteSchema>;

export async function createExpediente(body: CreateExpedienteDTO) {
  try {
    if (body.dtinicio) {
      const dtinicio = parse(body.dtinicio, "dd/MM/yyyy", new Date());
      if (isValid(dtinicio)) {
        body.dtinicio = format(dtinicio, "yyyy-MM-dd");
      }
    }

    if (body.dtfinal) {
      const dtfinal = parse(body.dtfinal, "dd/MM/yyyy", new Date());
      if (isValid(dtfinal)) {
        body.dtfinal = format(dtfinal, "yyyy-MM-dd");
      }
    }
    await http.post("https://api-cpsi.aapvr.com.br//expedientes", body);
    revalidatePath("/painel/expedientes");
  } catch (error: any) {
    console.error("Erro ao criar expediente:", error.message);
  }
}

export async function getExpedienteById(id: string) {
  const { data } = await http.get(`https://api-cpsi.aapvr.com.br//expedientes/${id}`);

  return data;
}

export async function updateExpediente(id: string, body: UpdateExpedienteDTO) {
  try {
    if (body.dtinicio) {
      const dtinicio = parse(body.dtinicio, "dd/MM/yyyy", new Date());
      if (isValid(dtinicio)) {
        body.dtinicio = format(dtinicio, "yyyy-MM-dd");
      }
    }

    if (body.dtfinal) {
      const dtfinal = parse(body.dtfinal, "dd/MM/yyyy", new Date());
      if (isValid(dtfinal)) {
        body.dtfinal = format(dtfinal, "yyyy-MM-dd");
      }
    }

    await http.patch(`https://api-cpsi.aapvr.com.br//expedientes/${id}`, body);
    revalidatePath("painel/expedientes");
  } catch (error) {
    console.error("Erro no update:", error);
    return {
      message: "Não foi possível fazer o update do Expediente",
      error: true,
    };
  }
}

export async function finalizarExpediente(id: string) {
  try {
    await http.delete(`https://api-cpsi.aapvr.com.br//expedientes/${id}`);
    revalidatePath("/painel/expedientes");
  } catch (error) {
    console.error("Erro na requisição:", error);
    return {
      message: "Não foi possível inativar a expediente",
      error: true,
    };
  }
}
