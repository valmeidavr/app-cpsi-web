import * as z from "zod";
export const updateUsuarioSchema = z
  .object({
    nome: z
      .string()
      .min(3, { message: "O nome deve ter pelo menos 3 caracteres" })
      .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
        message: "O nome pode conter apenas letras, espaços, hífens e apostrofes",
      }),
    email: z
      .string()
      .min(1, { message: "O campo é obrigatório" })
      .email({ message: "Email inválido" }),
    senha: z.string().optional().or(z.literal("")),
    confirmedsenha: z.string().optional().or(z.literal("")),
  })
  .refine((data) => {
    // Se senha foi informada, confirmedsenha deve ser igual
    if (data.senha && data.senha.trim() !== '') {
      return data.senha === data.confirmedsenha;
    }
    // Se senha não foi informada ou está vazia, não validar confirmação
    return true;
  }, {
    message: "As senhas não coincidem",
    path: ["confirmedsenha"],
  });