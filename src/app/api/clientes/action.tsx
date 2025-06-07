"use server";
import { Cliente } from "@/app/types/Cliente";
import { format } from "date-fns";
import { limparCEP, limparCPF, limparTelefone } from "@/util/clearData";

import { http } from "@/util/http";
import { revalidatePath } from "next/cache";
import { toast } from "sonner";
import {
  createClienteSchema,
  updateClienteSchema,
} from "./shema/formSchemaCliente";
import { z } from "zod";

export type CreateClienteDTO = z.infer<typeof createClienteSchema>;
export type UpdateClienteDTO = z.infer<typeof updateClienteSchema>;

export async function createCliente(body: CreateClienteDTO) {
  try {
    if (body.dtnascimento) {
      const parsedDate = new Date(body.dtnascimento);
      body.dtnascimento = format(parsedDate, "yyyy-MM-dd");
    }
    body.cpf = limparCPF(String(body.cpf));
    if (body.cep) {
      body.cep = limparCEP(String(body.cep));
    }

    body.telefone1 = limparTelefone(String(body.telefone1));
    if (body.telefone2) {
      body.telefone2 = limparTelefone(String(body.telefone2));
    }
    const { convenios, desconto, ...payload } = body;
    const { data } = await http.post("/clientes", payload);
    for (const convenio of convenios) {
      const convenioBody = {
        conveniosId: convenio,
        clientesId: data.id,
        desconto: desconto[convenio],
      };
      await http.post("/convenios-clientes", convenioBody);
    }
    revalidatePath("/painel/clientes");
  } catch (error: any) {
    console.error("Erro ao criar cliente:", error);
  }
}

export async function getClientes(
  page: number = 1,
  limit: number = 10,
  search?: string
) {
  const { data } = await http.get("/clientes", {
    params: { page, limit, search },
  });

  return data;
}

export async function getClienteById(id: number): Promise<Cliente> {
  const { data } = await http.get(`/clientes/${id}`);

  return data;
}

export async function updateCliente(id: string, body: UpdateClienteDTO) {
  try {
    if (body.dtnascimento) {
      const parsedDate = new Date(body.dtnascimento);
      body.dtnascimento = format(parsedDate, "yyyy-MM-dd");
    }
    if (body.cpf) {
      body.cpf = limparCPF(String(body.cpf));
    }
    if (body.cep) {
      body.cep = limparCEP(String(body.cep));
    }
    if (body.telefone1) {
      body.telefone1 = limparTelefone(String(body.telefone1));
    }
    if (body.telefone2) {
      body.telefone2 = limparTelefone(String(body.telefone2));
    }
    const { convenios, desconto, ...payload } = body;

    const { data } = await http.patch(
      `/clientes/${id}`,
      payload
    );
    if (convenios && convenios.length > 0) {
      for (const convenio of convenios) {
        const convenioBody = {
          conveniosId: convenio,
          clientesId: data.id,
          desconto: desconto?.[convenio] ?? null,
        };



        try {
          const res = await http.get(
            "/convenios-clientes",
            {
              params: {
                conveniosId: convenio,
                clientesId: data.id,
              },
            }
          );

          const existing = res.data?.data;

          if (existing?.id) {
            await http.patch(
              `/convenios-clientes/${existing.id}`,
              convenioBody
            );
          } else {
            await http.post(
              "/convenios-clientes",
              convenioBody
            );
          }
        } catch (err) {
          console.error("Erro ao processar convênio-cliente:", err);
        }
      }
    }
    revalidatePath("painel/clientes");
  } catch (error) {
    return {
      message: "Não foi possível fazer o update do Cliente",
      error: error,
    };
  }
}

export async function handleClienteStatus(id: number): Promise<void> {
  const cliente = await getClienteById(id);
  const { data } = await http.patch(`/clientes/${id}`, {
    status: cliente.status == "Ativo" ? "Inativo" : "Ativo",
  });
}
