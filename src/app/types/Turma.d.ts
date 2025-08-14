import { Prestador } from "./Prestador";
import { Procedimento } from "./Procedimento";

export type Turma = {
  id: number;
  nome: string;
  horario_inicio: string;
  horario_fim: string;
  data_inicio: string;
  data_fim: string;
  limite_vagas: number;
  prestador: Prestador;
  procedimento: Procedimento;
  TurmasDias: any[]; // Substitua por um tipo mais específico, se tiver
  Presenca: any[];
};