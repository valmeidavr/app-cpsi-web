"use server";

import { http } from "@/util/http";
import { format, isValid, parse } from "date-fns";
import { revalidatePath } from "next/cache";

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

type CreateLancamentoPayload = {
  valor: number;
  descricao: string;
  data_lancamento: string;
  tipo: "ENTRADA" | "SAIDA" | "ESTORNO" | "TRANSFERENCIA";
  clientes_Id?: number | null;
  plano_contas_id: number;
  caixas_id: number;
  lancamentos_original_id?: number | null;
  id_transferencia?: number | null;
  motivo_estorno?: string | null;
  motivo_transferencia?: string | null;
  forma_pagamento: "DINHEIRO" | "CARTAO" | "CHEQUE" | "BOLETO" | "PIX";
  status_pagamento: "PENDENTE" | "PAGO";
  agendas_id?: number | null;
  usuario_id: number;
};
type updateLancamentoPayload = {
  valor: number;
  descricao: string;
  data_lancamento: string;
  tipo: "ENTRADA" | "SAIDA" | "ESTORNO" | "TRANSFERENCIA";
  clientes_Id?: number | null;
  plano_contas_id: number;
  caixas_id: number;
  lancamentos_original_id?: number | null;
  id_transferencia?: number | null;
  motivo_estorno?: string | null;
  motivo_transferencia?: string | null;
  forma_pagamento: "DINHEIRO" | "CARTAO" | "CHEQUE" | "BOLETO" | "PIX";
  status_pagamento: "PENDENTE" | "PAGO";
  agendas_id?: number | null;
  usuario_id: number;
};
export async function createLancamento(body: CreateLancamentoPayload) {
  try {
    if (body.data_lancamento) {
      const parsedDate = parse(body.data_lancamento, "yyyy-MM-dd", new Date());

      if (isValid(parsedDate)) {
        body.data_lancamento = format(parsedDate, "yyyy-MM-dd");
      } else {
        console.error("Data de nascimento inválida:", body.data_lancamento);
      }
    }
    console.log("body:", body);
    const { data } = await http.post("http://localhost:3000/lancamentos", body);
    // revalidatePath("/painel/lancamentos");
  } catch (error: any) {
    console.error("Erro ao criar lancamento:", error);
  }
}

export async function getLancamentoById(id: string) {
  const { data } = await http.get(`http://localhost:3000/lancamentos/${id}`);
  return data;
}

export async function updateLancamento(
  id: string,
  body: updateLancamentoPayload
) {
  try {
    const { data } = await http.patch(
      `http://localhost:3000/lancamentos/${id}`,
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
    const response = await http.delete(`http://localhost:3000/lancamentos/${id}`);
    revalidatePath("painel/lancamentos");
  } catch {
    return {
      message: "Não foi possível inativar o lancamento",
      error: true,
    };
  }
}
