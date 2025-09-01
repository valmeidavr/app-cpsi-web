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
  TurmasDias: Array<{
    id: number;
    turma_id: number;
    dia_semana: string;
    horario_inicio: string;
    horario_fim: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  Presenca: Array<{
    id: number;
    turma_id: number;
    aluno_id: number;
    data: Date;
    presente: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
};