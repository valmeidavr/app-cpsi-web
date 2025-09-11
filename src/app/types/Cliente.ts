import { Agenda } from "./Agenda";
import { Convenio } from "./Convenios";
import ConveniosCliente from "./ConveniosCliente";
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
export type Cliente = {
  id: number;
  nome: string;
  cpf: string;
  rg: string;
  sexo: string;
  email: string;
  telefone1: string;
  status: string;
  dtnascimento: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
  telefone: string;
  celular: string;
  convenio_id: number;
  complemento?: string | null;
  cliente_id: number;
  tipoCliente: TipoCliente;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  Agenda: Agenda[];
  Convenio: Convenio;
  ConveniosCliente: ConveniosCliente[];
};
export type ClientePaginacao = {
  data: Cliente[];
  total: number;
  page: number;
  totalPages: number;
};