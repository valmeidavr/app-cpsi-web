import { z } from "zod";
export const createTurmaSchema = z.object({
  nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  horario_inicio: z.string().min(1, "Horário de início é obrigatório"),
  horario_fim: z.string().min(1, "Horário de fim é obrigatório"),
  data_inicio: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de início inválida"),
  limite_vagas: z.number().int().positive("Limite de vagas deve ser um número positivo"),
  procedimento_id: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => val > 0, { message: "Procedimento é obrigatório" }),
  prestador_id: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => val > 0, { message: "Prestador é obrigatório" }),
});
export const updateTurmaSchema = createTurmaSchema.partial();