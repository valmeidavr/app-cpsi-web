import * as z from "zod";

export const createConvenioSchema = z.object({
  nome: z
    .string()
    .min(1, { message: "O campo é obrigatório" })
    .min(3, { message: "O nome deve ter pelo menos 3 caracteres" })

    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, {
      message: "O nome não pode conter números ou símbolos",
    }),
  desconto: z.number().min(0, {message: "O campo é obrigatório"}),
  regras: z.string().min(1, { message: "O campo é obrigatório" }),
  tabelaFaturamentosId: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "O campo é obrigatório.",
    }),
});
export const updateConvenioSchema = createConvenioSchema.partial();