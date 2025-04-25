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
  clientesId: number | null;
  conveniosId: number | null;
  procedimentosId: number | null;
  expedientesId: number;
  prestadoresId: number;
  unidadesId: number;
  especialidadesId: number;

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
