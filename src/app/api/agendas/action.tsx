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
import { createLancamento } from "../lancamentos/action";
import { getPayload } from "@/util/auth";

export async function getAgendas(
  page: number = 1,
  limit: number = 5,
  search?: string,
  date?: Date
) {
  const dateString = date ? date.toISOString().split("T")[0] : undefined;
  const { data } = await http.get("http://localhost:3000/agendas", {
    params: { page, limit, search, date },
  });
  return data;
}
export type CreateAgendaDTO = z.infer<typeof createAgendaSchema>;
export type UpdateAgendaDTO = z.infer<typeof updateAgendaSchema>;
export async function createAgenda(
  body: CreateAgendaDTO
): Promise<Agenda | any> {
  try {
    const { horario, ...payloadCreate } = body;
    if (payloadCreate.dtagenda) {
      const dtagenda = parse(payloadCreate.dtagenda, "dd/MM/yyyy", new Date());
      if (isValid(dtagenda)) {
        payloadCreate.dtagenda = format(dtagenda, "yyyy-MM-dd");
      }
    }
    const agendamento: Agenda = await http.post(
      "http://localhost:3000/agendas",
      payloadCreate
    );
    const { cookies } = require("next/headers");
    const cookiesStore = await cookies();
    const token = cookiesStore.get("accessToken")?.value;
    const payload = getPayload(token);
    await createLancamento({
      valor: 0,
      descricao: `Agendamento ${agendamento.dtagenda}`,
      data_lancamento: new Date().toISOString(),
      tipo: "ENTRADA",
      clientes_Id: agendamento.clientesId,
      forma_pagamento: "DINHEIRO",
      status_pagamento: "PENDENTE",
      agendas_id: agendamento.id,
      usuario_id: payload?.usuario?.id,
    });

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
    const agendamento = await getAgendaById(id);
    const { cookies } = require("next/headers");
    const cookiesStore = await cookies();
    const token = cookiesStore.get("accessToken")?.value;
    const payload = getPayload(token);
    const { horario, ...payloadUpdate } = body;
    if (body.situacao == "AGENDADO") {
      await createLancamento({
        valor: 0,
        descricao: `Agendamento ${agendamento.dtagenda}`,
        data_lancamento: new Date().toString(),
        tipo: "ENTRADA",
        clientes_Id: agendamento.clientesId,
        forma_pagamento: "DINHEIRO",
        status_pagamento: "PENDENTE",
        agendas_id: agendamento.id,
        usuario_id: payload?.usuario?.id,
      });
    }

    await http.patch(`http://localhost:3000/agendas/${id}`, payloadUpdate);
    revalidatePath("/painel/agendas/_components/tabela_agenda");
  } catch (error) {
    console.error("Erro no update:", error);
    return {
      message: "Não foi possível fazer o update do Agenda",
      error: true,
    };
  }
}

export async function updateStatusAgenda(id: string, situacao: string) {
  try {
    await http.patch(`http://localhost:3000/agendas/${id}`, {
      situacao: situacao,
    });
    const agendamento = await getAgendaById(id);
    const { cookies } = require("next/headers");
    const cookiesStore = await cookies();
    const token = cookiesStore.get("accessToken")?.value;
    const payload = getPayload(token);

    if (situacao == "AGENDADO") {
      await createLancamento({
        valor: 0,
        descricao: `Agendamento ${agendamento.dtagenda}`,
        data_lancamento: new Date().toString(),
        tipo: "ENTRADA",
        caixas_id: 0,
        clientes_Id: agendamento.clientesId,
        plano_contas_id: 0,
        forma_pagamento: "DINHEIRO",
        status_pagamento: "PENDENTE",
        agendas_id: agendamento.id,
        usuario_id: payload?.usuario?.id,
      });
    }

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
    console.log("Finalizaragenda:", id);
    const payload = {
      situacao: "LIVRE",
      clientesId: null,
      conveniosId: null,
      procedimentosId: null,
    };
    await http.patch(`http://localhost:3000/agendas/${id}`, payload);
    console.log('foi')
    revalidatePath("/painel/agendas/_components/tabela_agenda");
  } catch (error) {
    console.error("Erro na requisição:", error);
    return {
      message: "Não foi possível inativar a agenda",
      error: true,
    };
  }
}
