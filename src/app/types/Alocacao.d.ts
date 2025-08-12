import { Especialidade } from "./Especialidade";
import { Unidade } from "./Unidades";

export interface Alocacao {
  id: number;
  unidade_id: number;
  especialidade_id: number;
  prestador_id: number;
  especialidade: Especialidade;
  unidade: Unidade;
  prestador: Prestador;
}
