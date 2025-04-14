import { Alocacao } from "./Alocacao";

export type Expediente = {
  id: number;
  dtinicio: string;
  dtfinal: string;
  hinicio: string;
  hfinal: string;
  intervalo: string;
  semana: string;
  alocacaoId: number;
  alocacao: Alocacao;
};
