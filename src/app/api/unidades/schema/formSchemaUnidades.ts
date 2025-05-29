import * as z from "zod";

export const createUnidadeSchema = z.object({
  nome: z
    .string()
    .min(1, { message: "O campo é obrigatório" })
    .min(3, { message: "O nome deve ter pelo menos 3 caracteres" })

,
});
export const updateUnidadeSchema = createUnidadeSchema.partial();