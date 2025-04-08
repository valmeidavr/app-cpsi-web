import { Lancamento } from "./Lancamento";

export type Caixa = {
  id: number;
  nome: string;
  saldo: number;
  tipo: TipoCaixa;
  lancamento: Lancamento;
};

enum TipoCaixa {
  "CAIXA",
  "BANCO",
}
