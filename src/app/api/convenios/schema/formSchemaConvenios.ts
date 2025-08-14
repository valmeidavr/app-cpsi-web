import * as z from "zod";

export const createConvenioSchema = z.object({
  nome: z
    .string()
    .min(1, { message: "O campo é obrigatório" })
    .min(3, { message: "O nome deve ter pelo menos 3 caracteres" }),

  desconto: z.number().min(0, {message: "O desconto deve ser maior ou igual a 0"}),
  regras: z.string().min(1, { message: "O campo é obrigatório" }),
  tabela_faturamento_id: z
    .number({ required_error: "Tabela de faturamento é obrigatória" })
    .min(1, { message: "Selecione uma tabela de faturamento válida" }),
});
export const updateConvenioSchema = createConvenioSchema.partial();