"use server";

import { http } from "@/util/http";
import { revalidatePath } from "next/cache";

import { format, isValid, parse } from "date-fns";

import { z } from "zod";
import {
  createAgendaSchema,
  updateAgendaSchema,
} from "./schema/formSchemaAgendas";
import { Agenda } from "@/app/types/Agenda";

export async function getAgendas(
  page: number = 1,
  limit: number = 5,
  search?: string,
  date?: Date
) {
  const dateString = date ? date.toISOString().split("T")[0] : undefined;
  console.log("Buscando agenda pela data:", dateString);
  const { data } = await http.get("http://localhost:3000/agendas", {
    params: { page, limit, search, date },
  });
  console.log("Retorno da busca dos agendamentos:", data);
  return data;
}
export type CreateAgendaDTO = z.infer<typeof createAgendaSchema>;
export type UpdateAgendaDTO = z.infer<typeof updateAgendaSchema>;
export async function createAgenda(body: CreateAgendaDTO): Promise<Agenda | any> {
  try {
    if (body.dtagenda) {
      const dtagenda = parse(body.dtagenda, "dd/MM/yyyy", new Date());
      if (isValid(dtagenda)) {
        body.dtagenda = format(dtagenda, "yyyy-MM-dd");
      }
    }
    await http.post("http://localhost:3000/agendas", body);
    revalidatePath("/painel/agendas/_components/tabela_agenda");
  } catch (error: any) {
    console.error("Erro ao criar agenda:", error.message);
  }
}

export async function getAgendaById(id: string) {
  const { data } = await http.get(`http://localhost:3000/agendas/${id}`);

  return data;
}

export async function updateAgenda(id: string, body: UpdateAgendaDTO) {
  try {
    if (body.dtagenda) {
      const dtagenda = parse(body.dtagenda, "dd/MM/yyyy", new Date());
      if (isValid(dtagenda)) {
        body.dtagenda = format(dtagenda, "yyyy-MM-dd");
      }
    }
    console.log("Body:",body, "Id:", id);
    await http.patch(`http://localhost:3000/agendas/${id}`, body);
    revalidatePath("/painel/agendas/_components/tabela_agenda");
  } catch (error) {
    console.error("Erro no update:", error);
    return {
      message: "Não foi possível fazer o update do Agenda",
      error: true,
    };
  }
}

export async function finalizarAgenda(id: string) {
  try {
    await http.delete(`http://localhost:3000/agendas/${id}`);
    revalidatePath("/painel/agendas");
  } catch (error) {
    console.error("Erro na requisição:", error);
    return {
      message: "Não foi possível inativar a agenda",
      error: true,
    };
  }
}
