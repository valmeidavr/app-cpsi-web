import { Lancamento } from "./Lancamento";
export enum TipoConta {
  ENTRADA = "ENTRADA",
  SAÍDA = "SAÍDA",
}
export type PlanoConta = {
  id: number;
  nome: string;
  tipo: TipoConta;
  categoria: string;
  descricao: string;
  lancamento?: Lancamento;
};