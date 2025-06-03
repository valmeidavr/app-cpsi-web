"use server";

import { http } from "@/util/http";
import { revalidatePath } from "next/cache";
import { toast } from "sonner";
import { z } from "zod";
import { createPrestadorSchema, updatePrestadorSchema } from "./schema/formSchemaPretadores";
import { format, isValid, parse } from "date-fns";
import {
  limparCEP,
  limparCPF,
  limparRG,
  limparTelefone,
} from "@/util/clearData";

export async function getPrestadors(
  page: number = 1,
  limit: number = 5,
  search?: string
) {
  const { data } = await http.get("https://api-cpsi.aapvr.com.br//prestadores", {
    params: { page, limit, search },
  });
  return data;
}

export type CreatePrestadorDTO = z.infer<typeof createPrestadorSchema>;
export type UpdatePrestadorDTO = z.infer<typeof updatePrestadorSchema>;


export async function createPrestador(body: CreatePrestadorDTO) {
  body.cpf = limparCPF(String(body.cpf));
  body.celular = limparTelefone(String(body.celular));
  body.rg = limparRG(body.rg);

  if (body.dtnascimento) {
    const parsedDate = parse(body.dtnascimento, "dd/MM/yyyy", new Date());

    if (isValid(parsedDate)) {
      body.dtnascimento = format(parsedDate, "yyyy-MM-dd");
    } else {
      console.error("Data de nascimento inválida:", body.dtnascimento);
    }
  }

  if (body.cep) {
    body.cep = limparCEP(String(body.cep));
  }
  if (body.telefone) {
    body.telefone = limparTelefone(String(body.telefone));
  }
  body.rg = limparRG(body.rg);
;
  try {
    const { data } = await http.post(`https://api-cpsi.aapvr.com.br//prestadores`, body);


    revalidatePath("/painel/prestadores");
  } catch (error: any) {
    console.error("Erro ao criar prestador:", error.message);
  }
}

export async function getPrestadorById(id: string) {
  const { data } = await http.get(`https://api-cpsi.aapvr.com.br//prestadores/${id}`);
  return data;
}

export async function updatePrestador(id: string, body: UpdatePrestadorDTO) {
 
  if (body.dtnascimento) {
    const parsedDate = parse(body.dtnascimento, "dd/MM/yyyy", new Date());
    if (isValid(parsedDate)) {
      body.dtnascimento = format(parsedDate, "yyyy-MM-dd");
    } else {
      console.error("Data de nascimento inválida:", body.dtnascimento);
    }
  }
  if (body.cpf) {
    body.cpf = limparCPF(String(body.cpf));
  }

  if (body.cep) {
    body.cep = limparCEP(String(body.cep));
  }
  if (body.rg) {
    body.rg = limparRG(body.rg);
  }
  if (body.telefone) {
    body.telefone = limparTelefone(String(body.telefone));
  }
  if (body.celular) {
    body.celular = limparTelefone(String(body.celular));
  }

  try {
    const { data } = await http.patch(
      `https://api-cpsi.aapvr.com.br//prestadores/${id}`,
      body
    );
    revalidatePath("painel/prestadores");
    return data;
  } catch (error) {
    console.error("Erro no update:", error);
    return {
      message: "Não foi possível fazer o update do Prestador",
      error: true,
    };
  }
}

export async function deletePrestador(id: number) {
  try {
    const response = await http.delete(`/prestadores/${id}`);
    revalidatePath("painel/prestadores");
  } catch {
    return {
      message: "Não foi possível inativar o prestador",
      error: true,
    };
  }
}
