import * as z from "zod";

export const formSchema = z.object({
  nome: z
    .string()
    .min(3, { message: "O nome deve ter pelo menos 3 caracteres" })
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, {
      message: "O nome não pode conter números ou símbolos",
    }),

  email: z
    .string()
    .min(1, { message: "O campo é obrigatório" })
    .email({ message: "Email inválido" })
    .default(""),
  senha: z.string().min(1, { message: "O campo é obrigatório" }),
  confirmedsenha: z.string(),
  sistema: z.record(z.number()),
});
