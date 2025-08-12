import { Cliente } from "./Cliente";
import { Convenio } from "./Convenios";

export default interface ConveniosCliente {
  clientes: Cliente[];
  cliente_id: number;
  convenios: Convenio[];
  createdAt: Date;
  deletedAt: Date;
  desconto: number;
  id: number;
  nome: string;
  regras: string;
  tabela_faturamento_id: number;
  updatedAt: Date;
}
