import * as z from "zod";
export const createPlanosSchema = z.object({
  nome: z
    .string()
    .min(1, { message: "O campo é obrigatório" })
    .min(3, { message: "O nome deve ter pelo menos 3 caracteres" })
,
  tipo: z.string().min(1, { message: "Tipo é obrigatório" }).default(""),
  categoria: z.string().min(1, { message: "O campo é obrigatório" }),
  descricao: z
    .string()
    .max(255, { message: "A descrição deve ter no máximo 255 caracteres" }),
});
export const updatePlanosSchema = createPlanosSchema.partial();