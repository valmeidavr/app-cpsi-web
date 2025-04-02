import * as z from "zod";

export const formSchema = z.object({
  status: z.string().min(1, { message: "O status é obrigatório" }),
  nome: z
    .string()
    .min(3, { message: "O nome deve ter pelo menos 3 caracteres" })
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, {
      message: "O nome não pode conter números ou símbolos",
    }),
  rg: z
    .string()
    .min(9, { message: "O RG deve ter pelo menos 9 caracteres" })
    .regex(/^\d{2}\.\d{3}\.\d{3}-\d$/, { message: "Formato de RG inválido" }),
  cpf: z
    .string()
    .length(14, { message: "O CPF deve ter 14 caracteres" })
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, {
      message: "Formato de CPF inválido",
    }),
  sexo: z.string().min(1, { message: "O campo sexo é obrigatório" }),
  dtnascimento: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, {
      message: "Formato de data inválido (DD/MM/AAAA)",
    }),
  cep: z
    .string()
    .length(9, { message: "O CEP deve ter 9 caracteres" })
    .regex(/^\d{5}-\d{3}$/, { message: "Formato de CEP inválido" }),
  logradouro: z.string().min(1, { message: "O logradouro é obrigatório" }),
  numero: z.string().min(1, { message: "O número é obrigatório" }),
  bairro: z.string().min(1, { message: "O bairro é obrigatório" }),
  cidade: z.string().min(1, { message: "A cidade é obrigatória" }),
  uf: z.string().length(2, { message: "UF deve ter 2 caracteres" }),
  telefone: z
    .string()
    .regex(/^\(\d{2}\) \d{4}-\d{4}$/, {
      message: "Formato de telefone inválido",
    })
    .optional(),
  celular: z
    .string()
    .regex(/^\(\d{2}\) \d{5}-\d{4}$/, {
      message: "Formato de celular inválido",
    }),
  complemento: z.string().optional(),
});
