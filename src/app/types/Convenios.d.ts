import { TabelaFaturamento } from "./TabelaFaturamento";

export type Convenio = {
  id: number;
  nome: string;
  desconto: number;
  regras: string;
  tabela_faturamento_id: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  tabelaFaturamento: TabelaFaturamento;
};
