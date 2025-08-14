import { z } from "zod";

export const createAlunoTurmaSchema = z.object({
  cliente_id: z.number().int({ message: "ID do cliente deve ser um número inteiro" }),
  turma_id: z.number().int({ message: "ID da turma deve ser um número inteiro" }),
  data_inscricao: z.string().optional(),
});

export const updateAlunoTurmaSchema = createAlunoTurmaSchema.partial();
