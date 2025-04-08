export type Procedimento = {
  id: number;
  nome: string;
  codigo: string;
  tipo: string; // ou um enum, se `TipoProcedimento` for um enum Prisma
  especialidadeId: number;
  especialidade: Especialidade; // precisa importar ou definir esse tipo também
  status: string;
  createdAt: Date;
  updatedAt: Date;
  Turma: any[]; // Substituir por um tipo mais específico se tiver
  Agenda: any[]; // Substituir por um tipo mais específico se tiver
};
