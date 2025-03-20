"use server";
import {
  Cliente,
  ClientePaginacao,
  CreateCliente,
  Status,
} from "@/app/types/Cliente";
import { format } from "date-fns";
import { limparCEP, limparCPF, limparTelefone } from "@/util/clearData";

import { httpServer } from "@/util/htppServer";
import { revalidatePath } from "next/cache";
import { toast } from "sonner";

export async function createCliente(body: CreateCliente) {
  try {
    if (body.dtnascimento) {
      const parsedDate = new Date(body.dtnascimento);
      body.dtnascimento = format(parsedDate, "yyyy-MM-dd");
    }
    body.cpf = limparCPF(String(body.cpf));
    body.cep = limparCEP(String(body.cep));
    body.telefone1 = limparTelefone(String(body.telefone1));
    if (body.telefone2) {
      body.telefone2 = limparTelefone(String(body.telefone2));
    }

    await httpServer.post("/clientes", body);

    toast.success("Cliente criado com sucesso!");
    revalidatePath("/painel/clientes"); // 🔄 Revalida os dados para refletir a alteração
  } catch (error: any) {
    console.error("Erro ao criar cliente:", error);
    toast.error(error.response?.data?.message || "Erro ao criar cliente.");
  }
}


export async function getClientes(
  page: number = 1,
  limit: number = 10,
  search?: string
){
  const { data } = await httpServer.get("/clientes", {
    params: { page, limit, search },
  });

  return data;
}

export async function getClienteById(id: number): Promise<Cliente> {
  const { data } = await httpServer.get(`/clientes/${id}`);

  return data;
}

export async function updateCliente(id: string, body: CreateCliente) {
  try {
    if (body.dtnascimento) {
      const parsedDate = new Date(body.dtnascimento);
      body.dtnascimento = format(parsedDate, "yyyy-MM-dd");
    }
    body.cpf = limparCPF(String(body.cpf));
    if(body.cep) body.cep = limparCEP(String(body.cep));
    body.telefone1 = limparTelefone(String(body.telefone1));
    body.telefone2 = limparTelefone(String(body.telefone2));

    await httpServer.patch(`/clientes/${id}`, body);
    toast.success("Cliente atualizado com sucesso!");
    revalidatePath("painel/clientes");
  } catch (error) {
    return {
      message: "Não foi possível fazer o update do Cliente",
      error: true,
    };
  }
}

export async function handleClienteStatus(id: number): Promise<void> {
  const cliente = await getClienteById(id);
  const { data } = await httpServer.patch(`/clientes/${id}`, {
    status: cliente.status == "Ativo" ? "Inativo" : "Ativo",
  });
}
