export enum Status {
 "Ativo",
 "Inativo",
}

export type Cliente = {
  id: string;
  nome: string;
  email: string;
  dtnascimento?: string;
  sexo: string;
  cpf: string;
  cep?: string | undefined;
  logradouro?: string ;
  numero?: string ;
  bairro?: string ;
  cidade?: string ;
  uf?: string ;
  telefone1: string;
  telefone2?: string | undefined;
  status?: Status | string;
};

export type CreateCliente = {
  nome: string;
  email: string;
  dtnascimento?: string;
  sexo: string;
  cpf: string;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  telefone1: string;
  telefone2?: string | undefined;
  status?: Status | string;
};


export type ClientePaginacao = {
  data: Cliente[];
  total: number = 10;
  page: number = 1;
  totalPages: number;
};
