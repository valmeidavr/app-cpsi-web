import * as z from "zod";
export const createEspecialidadeSchema = z.object({
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
});
export const updateEspecialidadeSchema = createEspecialidadeSchema.partial();