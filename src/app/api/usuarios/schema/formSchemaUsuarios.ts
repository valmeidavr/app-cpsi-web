import * as z from "zod";

export const formSchema = z
  .object({
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
    senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmedsenha: z.string().min(6, "A confirmação de senha é obrigatória"),
    sistema: z.record(z.number()),
  })
  .refine((data) => data.senha === data.confirmedsenha, {
    message: "As senhas não coincidem",
    path: ["confirmedsenha"],
  });
