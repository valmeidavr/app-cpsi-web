import { Cliente, ClientePaginacao, Status } from "@/app/types/Cliente";
import { http } from "@/util/http";
import { format } from "date-fns";
import { limparCEP, limparCPF, limparTelefone } from "@/util/clearData";


export async function createCliente(body: Cliente) {
  if (body.dtnascimento) {
    const parsedDate = new Date(body.dtnascimento);
    body.dtnascimento = format(parsedDate, "yyyy-MM-dd");
  }
  console.log(body.dtnascimento);
  body.cpf = limparCPF(String(body.cpf));
  body.cep = limparCEP(String(body.cep));
  body.telefone1 = limparTelefone(String(body.telefone1));
  if (body.telefone2) {
    
    body.telefone2 = limparTelefone(String(body.telefone2));
  }
  
  await http.post('/clientes',body);
}

export async function getClientes(
  page: number = 1,
  limit: number = 10,
  search?: string
): Promise<ClientePaginacao> {
  const { data } = await http.get("/clientes", {
    params: { page, limit, search },
  });

  return data;
}

export async function getClienteById(id: number): Promise<Cliente> {
  const { data } = await http.get(`/clientes/${id}`);

  return data;
}



export async function updateCliente(
  id: string,
  body: Cliente
): Promise<Cliente> {
  if (body.dtnascimento) {
    body.dtnascimento = format(body.dtnascimento, "dd/MM/yyyy");
  }
  body.cpf = limparCPF(String(body.cpf));
  body.cep = limparCEP(String(body.cep));
  body.telefone1 = limparTelefone(String(body.telefone1));
  body.telefone2 = limparTelefone(String(body.telefone2));

  const { data } = await http.patch(`/clientes/${id}`, body);

  return data;
}

export async function handleCliente(id: number, status: Status): Promise<void> {
  const { data } = await http.patch(`/clientes/${id}`, {
    status: !status,
  });

  return data;
}
