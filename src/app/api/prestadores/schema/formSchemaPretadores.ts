import * as z from "zod";

export const createPrestadorSchema = z.object({
  nome: z
    .string()
    .min(3, { message: "O nome deve ter pelo menos 3 caracteres" }),

  rg: z
    .string()
    .min(1, { message: "O RG é obrigatório" })
    .optional(),

  cpf: z
    .string()
    .min(1, { message: "O CPF é obrigatório" })
    .optional(),

  sexo: z.string().min(1, { message: "O campo sexo é obrigatório" }).optional(),

  dtnascimento: z
    .string()
    .min(1, { message: "O campo data de nascimento é obrigatório" })
    .optional(),

  cep: z.string().optional(),

  logradouro: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),

  telefone: z.string().optional(),

  celular: z.string().optional(),

  complemento: z.string().optional(),
});

export const updatePrestadorSchema = createPrestadorSchema.partial();