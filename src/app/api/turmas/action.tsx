"use server";

import { http } from "@/util/http";
import { revalidatePath } from "next/cache";
import { toast } from "sonner";
import { string, z } from "zod";

import { format, isValid, parse, parseISO } from "date-fns";
import {
  limparCEP,
  limparCPF,
  limparRG,
  limparTelefone,
} from "@/util/clearData";
import { formSchema } from "./schema/formSchemaTurmas";

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

export type TurmaDTO = {
  nome: string;
  horarioInicio: string;
  horarioFim: string;
  dataInicio: string;
  dataFim?: string;
  limiteVagas: number;
  procedimentosId: number;
  prestadoresId: number;
};
export type UpdateTurmaDTO = {
  nome?: string;
  horarioInicio?: string;
  horarioFim?: string;
  dataInicio?: string;
  dataFim?: string;
  limiteVagas?: number;
  procedimentosId?: number;
  prestadoresId?: number;
};
export async function createTurma(body: TurmaDTO) {
  if (body.dataInicio) {
    const dataInicio = parse(body.dataInicio, "dd/MM/yyyy", new Date());
    if (isValid(dataInicio)) {
      body.dataInicio = format(dataInicio, "yyyy-MM-dd");
    }
  }

  if (body.dataFim) {
    const dataFim = parse(body.dataFim, "dd/MM/yyyy", new Date());
    if (isValid(dataFim)) {
      body.dataFim = format(dataFim, "yyyy-MM-dd");
    }
  }
  const { horarioInicio, horarioFim, ...restoDoBody } = body;

  const bodyFormatado = {
    ...restoDoBody,
    horario: `${horarioInicio} - ${horarioFim}`,
  };
  try {
    const { data } = await http.post(
      "http://localhost:3000/turmas",
      bodyFormatado
    );
    revalidatePath("/painel/turmas");
  } catch (error: any) {
    console.error("Erro ao criar turma:", error.message);
  }
}

export async function getTurmaById(id: string) {
  const { data } = await http.get(`http://localhost:3000/turmas/${id}`);
  console.log(data);
  return data;
}

export async function updateTurma(id: string, body: UpdateTurmaDTO) {
  if (body.dataInicio) {
    const dataInicio = parse(body.dataInicio, "dd/MM/yyyy", new Date());
    if (isValid(dataInicio)) {
      body.dataInicio = format(dataInicio, "yyyy-MM-dd");
    }
  }

  if (body.dataFim) {
    const dataFim = parse(body.dataFim, "dd/MM/yyyy", new Date());
    if (isValid(dataFim)) {
      body.dataFim = format(dataFim, "yyyy-MM-dd");
    }
  }
  const { horarioInicio, horarioFim, ...restoDoBody } = body;

  const bodyFormatado = {
    ...restoDoBody,
    horario: `${horarioInicio} - ${horarioFim}`,
  };

  console.log("bodyFormatado", bodyFormatado);
  try {
    await http.patch(`http://localhost:3000/turmas/${id}`, bodyFormatado);
    revalidatePath("painel/turmas");
  } catch (error) {
    console.error("Erro no update:", error);
    return {
      message: "Não foi possível fazer o update do Turma",
      error: true,
    };
  }
}

export async function finalizarTurma(id: number, body: UpdateTurmaDTO) { 
  try {
     await http.patch(`http://localhost:3000/turmas/${id}`, { dataFim: body.dataFim });
    revalidatePath("/painel/turmas");
  } catch (error) {
    console.error("Erro na requisição:", error);
    return {
      message: "Não foi possível inativar a turma",
      error: true,
    };
  }
}
