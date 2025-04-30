import { z } from "zod";

export const createTurmaSchema = z.object({
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  horarioInicio: z.string(),
  horarioFim: z.string(),
  dataInicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de início inválida"),
  limiteVagas: z.number().int().positive(),
  procedimentosId: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => val > 0, { message: "Campo obrigatório" }),
  prestadoresId: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => val > 0, { message: "Campo obrigatório" }),
});
export const updateTurmaSchema = createTurmaSchema.partial();