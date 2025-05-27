import { Cliente } from "./Cliente";
import { Convenio } from "./Convenios";

export default interface ConveniosCliente {
  clientes: Cliente[];
  clientesId: number;
  convenios: Convenio[];
  createdAt: Date;
  deletedAt: Date;
  desconto: number;
  id: number;
  nome: string;
  regras: string;
  tabelaFaturamentosId: number;
  updatedAt: Date;
}
