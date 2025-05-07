import { z } from "zod";

export const createExpedienteSchema = z.object({
  dtinicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Este campo é obrigatório",
  }),
  dtfinal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Este campo é obrigatório",
  }),
  hinicio: z.string().min(1, "Este campo é obrigatório"),
  hfinal: z.string(),
  intervalo: z.string(),
  semana: z.string().optional(),
  alocacaoId: z
    .number()
    .int({ message: "alocacaoId deve ser um número inteiro" }),
});
export const updateExpedienteSchema = createExpedienteSchema.partial();
