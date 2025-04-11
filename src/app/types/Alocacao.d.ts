import { Especialidade } from "./Especialidade";
import { Unidade } from "./Unidades";

export interface Alocacao {
  id: number;
  unidadesId: number;
  especialidadesId: number;
  prestadoresId: number;
  especialidade: Especialidade;
  unidade: Unidade;
  prestador: Prestador;
}
