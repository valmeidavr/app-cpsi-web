import * as z from "zod";

export const formSchema = z.object({
  nome: z
    .string()
    .min(1, { message: "O campo é obrigatório" })
    .min(3, { message: "O nome deve ter pelo menos 3 caracteres" })

    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, {
      message: "O nome não pode conter números ou símbolos",
    }),

  codigo: z
    .string()
    .min(1, { message: "O campo é obrigatório" })
    .regex(/^\d+$/, {
      message: "Apenas números são permitidos",
    }),

  tipo: z.string().min(1, { message: "Tipo é obrigatório" }).default(""),

  especialidadeTeste: z.string().default(""), //Somente para testar o select com dados mockados

  especialidadeId: z.record(z.number().optional()).optional(),
});
