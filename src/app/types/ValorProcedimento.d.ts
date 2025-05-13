import { Procedimento } from "./Procedimento";
import { TabelaFaturamento } from "./TabelaFaturamento";
export enum TipoCliente {
  SOCIO = "SOCIO",
  NSOCIO = "NSOCIO",
  PARCEIRO = "PARCEIRO",
  FUNCIONARIO = "FUNCIONARIO",
}
export type ValorProcedimento = {
  id: number;
  valor: string;
  tipo: TipoCliente;
  tabelaFaturamentosId: number;
  procedimentosId: number;
  createdAt: Date;
  updatedAt: Date;
  procedimento: Procedimento;
  tabelaFaturamento: TabelaFaturamento;
};
