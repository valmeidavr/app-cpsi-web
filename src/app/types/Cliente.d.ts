export enum Status {
  Ativo = "Ativo",
  Inativo = "Inativo",
}

export type Cliente = {
  id?: string;
  nome: string;
  email: string;
  dtnascimento: string | null;
  sexo: string | null;
  cpf: string;
  cep?: string | undefined;
  logradouro?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  telefone1: string;
  telefone2?: string | undefined;
  status?: Status;
};

export type ClientePaginacao = {
  data: Cliente[];
  total: number = 10;
  page: number = 1;
  totalPages: number;
};
