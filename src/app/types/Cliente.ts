export enum Status {
  "Ativo",
  "Inativo",
}

export enum TipoCliente {
  SOCIO = "SOCIO",
  NSOCIO = "NSOCIO",
  PARCEIRO = "PARCEIRO",
  FUNCIONARIO = "FUNCIONARIO",
}

type Convenio = {
  id: number;
  conveniosId: number;
  desconto: number;
  clientesId: number;
  clientes: Cliente[];
  convenios: Convenio[];
};
export type Cliente = {
  id: string;
  nome: string;
  email: string;
  dtnascimento?: string;
  sexo: string;
  tipo: TipoCliente;
  cpf: string;
  cep?: string | undefined;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  telefone1: string;
  telefone2?: string | undefined;
  Convenio?: Convenio[];
  status?: Status | string;
  created_at: string;
  updated_at: string;
};

export type ClientePaginacao = {
  data: Cliente[];
  total: number;
  page: number;
  totalPages: number;
};
