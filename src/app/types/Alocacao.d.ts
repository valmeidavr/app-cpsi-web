import { Especialidade } from "./Especialidade";
import { Unidade } from "./Unidades";
import { Prestador } from "./Prestador";

export interface Alocacao {
  id: number;
  unidade_id: number;
  especialidade_id: number;
  prestador_id: number;
  especialidade: Especialidade;
  unidade: Unidade;
  prestador: Prestador;
  // Novos campos retornados pela API com JOIN
  especialidade_nome?: string;
  unidade_nome?: string;
  prestador_nome?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
