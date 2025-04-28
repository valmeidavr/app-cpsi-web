import { Cliente } from "./Cliente";
import { Turma } from "./Turma";

export type Aluno = {
  id: number;
  turmasId: number;
  clientesId: number;
  data_inscricao: string;
  createdAt: string;
  updatedAt: string;
  cliente: Cliente;
  turma: Turma;
};
