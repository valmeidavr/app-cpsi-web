import * as z from "zod";

export const createProcedimentoSchema = z.object({
  nome: z
    .string()
    .min(1, { message: "O campo é obrigatório" })
    .min(3, { message: "O nome deve ter pelo menos 3 caracteres" })

,

  codigo: z
    .string()
    .min(1, { message: "O campo é obrigatório" })
    .regex(/^\d+$/, {
      message: "Apenas números são permitidos",
    }),

  tipo: z.string().min(1, { message: "Tipo é obrigatório" }).default(""),

  especialidadeId: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val)),
});
export const updateProcedimentoSchema = createProcedimentoSchema.partial();