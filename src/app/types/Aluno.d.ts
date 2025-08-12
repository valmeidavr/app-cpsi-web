import { Cliente } from "./Cliente";
import { Turma } from "./Turma";

export type Aluno = {
  id: number;
  turma_id: number;
  cliente_id: number;
  data_inscricao: string;
  createdAt: string;
  updatedAt: string;
  cliente: Cliente;
  turma: Turma;
};
