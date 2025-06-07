import { Caixa } from "./Caixa";
import { PlanoConta } from "./PlanoConta";
import { Usuario } from "./Usuario";

export type Lancamento = {
  id: number;
  valor: number;
  descricao: string;
  data_lancamento: string;
  tipo: "ENTRADA" | "SAIDA" | "ESTORNO" | "TRANSFERENCIA";
  clientes_Id?: number | null;
  plano_contas_id: number;
  caixas_id: number;
  lancamentos_original_id?: number | null;
  id_transferencia?: number | null;
  motivo_estorno?: string | null;
  motivo_transferencia?: string | null;
  forma_pagamento: "DINHEIRO" | "CARTAO" | "CHEQUE" | "BOLETO" | "PIX";
  status_pagamento: "PENDENTE" | "PAGO";
  agendas_id?: number | null;
  usuario_id: number;
  plano_conta: PlanoConta;
  caixa: Caixa;
  usuario: Usuario;
  status?: string;
  created_at: string;
  updated_at: string;
};
