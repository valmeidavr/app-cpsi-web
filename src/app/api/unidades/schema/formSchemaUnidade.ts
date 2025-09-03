import * as z from "zod";

export const createUnidadeSchema = z.object({
  nome: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres" }),
  descricao: z.string().optional(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  telefone1: z.string().optional(),
  telefone2: z.string().optional(),
  email: z.string().email({ message: "Email inválido" }).optional(),
});

export const updateUnidadeSchema = createUnidadeSchema.partial();
