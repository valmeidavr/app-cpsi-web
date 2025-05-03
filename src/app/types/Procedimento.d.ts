import { Agenda } from "./Agenda";
import { Turma } from "./Turma";

export type Procedimento = {
  id: number;
  nome: string;
  codigo: string;
  tipo: string;
  especialidadeId: number;
  especialidade: Especialidade; 
  status: string;
  createdAt: Date;
  updatedAt: Date;
  Turma: Turma[]; 
  Agenda: Agenda[]; 
};
