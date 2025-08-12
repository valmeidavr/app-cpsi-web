import { Cliente } from "./Cliente";
import { Convenio } from "./Convenios";
import { Especialidade } from "./Especialidade";
import { Expediente } from "./Expediente";
import { Prestador } from "./Prestador";
import { Procedimento } from "./Procedimento";
import { Unidade } from "./Unidades";

export interface Agenda {
  id: number;
  dtagenda: string;
  situacao: Situacao;
  cliente_id: number | null;
  convenio_id: number | null;
  procedimento_id: number | null;
  expediente_id: number | null;
  prestador_id: number;
  unidade_id: number | null;
  especialidade_id: number | null;
  tipo: "PROCEDIMENTO" | "ENCAIXE";

  // Campos de JOIN para exibição
  cliente_nome?: string;
  convenio_nome?: string;
  procedimento_nome?: string;
  expediente_nome?: string;
  prestador_nome?: string;
  unidade_nome?: string;
  especialidade_nome?: string;

  // Relacionamentos (opcionais)
  clientes?: Cliente;
  convenios?: Convenio;
  procedimentos?: Procedimento;
  expediente?: Expediente;
  prestador?: Prestador;
  unidade?: Unidade;
  especialidade?: Especialidade;
  
  createdAt: Date;
  updatedAt: Date;
}

export enum Situacao {
  AGENDADO = "AGENDADO",
  FALTA = "FALTA",
  FINALIZADO = "FINALIZADO",
  LIVRE = "LIVRE",
  INATIVO = "INATIVO",
  BLOQUEADO = "BLOQUEADO",
  CONFIRMADO = "CONFIRMADO",
}
