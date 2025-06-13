import { z } from "zod";

const dataLimite = new Date("2000-01-01");

// Schema base (sem refinamento entre dtinicio e dtfinal)
const expedienteBaseSchema = z.object({
  dtinicio: z.string().refine((val) => new Date(val) >= dataLimite, {
    message: "A data de início não pode ser muito antiga",
  }),
  dtfinal: z.string().refine((val) => new Date(val) >= dataLimite, {
    message: "A data de fim não pode ser muito antiga",
  }),
  hinicio: z.string().min(1, "Este campo é obrigatório"),
  hfinal: z.string(),
  intervalo: z.string().min(1, "O intervalo é obrigatório."),
  semana: z.string().optional(),
  alocacaoId: z
    .number()
    .int({ message: "alocacaoId deve ser um número inteiro" }),
});

// Aplica regra extra só no schema de criação
export const createExpedienteSchema = expedienteBaseSchema.refine(
  (data) => new Date(data.dtfinal) >= new Date(data.dtinicio),
  {
    message: "A data de fim deve ser maior ou igual à data de início",
    path: ["dtfinal"],
  }
);

// `partial()` funciona porque ainda é um ZodObject
export const updateExpedienteSchema = expedienteBaseSchema.partial();
