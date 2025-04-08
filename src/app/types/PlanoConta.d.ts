export type PlanoConta = {
  id: number;
  nome: string;
  tipo: TipoConta;
  categoria: string;
  descricao: string;
  lancamento: Lancamento;
};

enum TipoConta {
  "ENTRADA",
  "SAIDA",
}
