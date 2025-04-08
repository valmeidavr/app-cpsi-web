import { Prestador } from "./Prestador";

export type Turma = {
  id: number;
  nome: string;
  horario: string;
  dataInicio: string;
  dataFim: string;
  limiteVagas: number;
  prestador: Prestador;
  procedimento: Procedimento;
  TurmasDias: any[]; // Substitua por um tipo mais específico, se tiver
  Presenca: any[];
};