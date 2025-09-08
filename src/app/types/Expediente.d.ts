import { Alocacao } from "./Alocacao";
export type Expediente = {
  id: number;
  dtinicio: string;
  dtfinal: string;
  hinicio: string;
  hfinal: string;
  intervalo: string;
  semana: string;
  alocacao_id: number;
  alocacao: Alocacao;
  unidade_id?: number;
  especialidade_id?: number;
  prestador_id?: number;
  unidade_nome?: string;
  especialidade_nome?: string;
  prestador_nome?: string;
};