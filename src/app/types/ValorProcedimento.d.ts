import { Procedimento } from "./Procedimento";
import { TabelaFaturamento } from "./TabelaFaturamento";
export type TipoCliente = "SOCIO" | "NSOCIO" | "FUNCIONARIO" | "PARCEIRO";
export type ValorProcedimento = {
  id: number;
  valor: string;
  tipo: TipoCliente;
  tabela_faturamento_id: number;
  procedimento_id: number;
  convenio_id?: number;
  createdAt: Date;
  updatedAt: Date;
  procedimento: Procedimento;
  tabelaFaturamento: TabelaFaturamento;
};