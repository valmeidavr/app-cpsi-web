import { Cliente } from "./Cliente";
import { Convenio } from "./Convenios";
import { Especialidade } from "./Especialidade";
import { Expediente } from "./Expediente";
import { Prestador } from "./Prestador";
import { Procedimento } from "./Procedimento";
import { Unidade } from "./Unidades";

export interface Agenda {
  id: number;
  dtagenda: DateTime;
  situacao: Situacao;
  cliente_id: number | null;
  convenio_id: number | null;
  procedimento_id: number | null;
  expediente_id: number;
  prestador_id: number;
  unidade_id: number;
  especialidade_id: number;

  clientes: Cliente;
  convenios: Convenio;
  procedimentos: Procedimento;
  expediente: Expediente;
  prestador: Prestador;
  unidade: Unidade;
  especialidade: Especialidade;
  createdAt: Date;
  updatedAt: Date;
}

enum Situacao {
  AGENDADO = "AGENDADO",
  FALTA = "FALTA",
  FINALIZADO = "FINALIZADO",
  LIVRE = "LIVRE",
  INATIVO = "INATIVO",
  BLOQUEADO = "BLOQUEADO",
  CONFIRMADO = "CONFIRMADO",
}
