import * as z from "zod";

export const createTabelaFaturamentoSchema = z.object({
  nome: z
    .string()
    .min(1, { message: "O campo é obrigatório" })
    .min(3, { message: "O nome deve ter pelo menos 3 caracteres" })

    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, {
      message: "O nome não pode conter números ou símbolos",
    }),
});

export const updateTabelaFaturamentoSchema = createTabelaFaturamentoSchema.partial();
