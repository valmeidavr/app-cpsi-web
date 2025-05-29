import * as z from "zod";

export const createCaixaSchema = z.object({
  nome: z
    .string()
    .min(1, { message: "O campo é obrigatório" })
    .min(3, { message: "O nome deve ter pelo menos 3 caracteres" })

,
  tipo: z.string().min(1, { message: "Tipo é obrigatório" }).default(""),
  saldo: z.union([
    z.string().transform((val) => {
      const limpo = val
        .replace("R$", "")
        .replace(/\./g, "")
        .replace(",", ".")
        .trim();
      return parseFloat(limpo);
    }),
    z.number(),
  ]),
});

export const updateCaixaSchema = createCaixaSchema.partial();
