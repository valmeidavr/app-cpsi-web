import { Agenda } from "./Agenda";
import { Turma } from "./Turma";
import { Especialidade } from "./Especialidade";

export type Procedimento = {
  id: number;
  nome: string;
  codigo: string;
  tipo: string;
  especialidade_id: number;
  especialidade: Especialidade; 
  status: string;
  createdAt: Date;
  updatedAt: Date;
  Turma: Turma[]; 
  Agenda: Agenda[]; 
};
