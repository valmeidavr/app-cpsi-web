"use server";

import { http } from "@/util/http";
import { revalidatePath } from "next/cache";
import { toast } from "sonner";
import { z } from "zod";
import { formSchema } from "./schema/formSchemaPretadores";
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
  const { data } = await http.get("/prestadores", {
    params: { page, limit, search },
  });
  return data;
}

export type PrestadorDTO = z.infer<typeof formSchema>;
export async function createPrestador(body: PrestadorDTO) {
  if (body.dtnascimento) {
    const parsedDate = parse(body.dtnascimento, "dd/MM/yyyy", new Date());

    // Verifique se a data é válida antes de tentar formatá-la
    if (isValid(parsedDate)) {
      // Formate a data para o formato yyyy-MM-dd
      body.dtnascimento = format(parsedDate, "yyyy-MM-dd");
    } else {
      console.error("Data de nascimento inválida:", body.dtnascimento);
    }
  }
  body.cpf = limparCPF(String(body.cpf));
  if (body.cep) {
    body.cep = limparCEP(String(body.cep));
  }
  body.celular = limparTelefone(String(body.celular));
  if (body.telefone) {
    body.telefone = limparTelefone(String(body.telefone));
  }
  body.rg = limparRG(body.rg);
  console.log("boyd:", body);
  try {
    const { data } = await http.post("http://localhost:3000/prestadores", body);

    console.log("data:", data);
    revalidatePath("/painel/prestadores");
  } catch (error: any) {
    console.error("Erro ao criar prestador:", error.message);
  }
}

export async function getPrestadorById(id: string) {
  const { data } = await http.get(`http://localhost:3000/prestadores/${id}`);
  return data;
}

export async function updatePrestador(id: string, body: PrestadorDTO) {
  console.log(body);
  if (body.dtnascimento) {
    const parsedDate = parse(body.dtnascimento, "dd/MM/yyyy", new Date());

    // Verifique se a data é válida antes de tentar formatá-la
    if (isValid(parsedDate)) {
      // Formate a data para o formato yyyy-MM-dd
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
  body.celular = limparTelefone(String(body.celular));
  if (body.telefone) {
    body.telefone = limparTelefone(String(body.telefone));
  }
  console.log("body:", body);
  console.log("id", id);
  try {
    const { data } = await http.patch(
      `http://localhost:3000/prestadores/${id}`,
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
