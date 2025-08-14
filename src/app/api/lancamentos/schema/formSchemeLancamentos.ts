import * as z from "zod";

export const createLancamentoSchema = z.object({
  valor: z
    .union([
      z.string().transform((val) => {
        const limpo = val
          .replace("R$", "")
          .replace(/\./g, "")
          .replace(",", ".")
          .trim();
        return parseFloat(limpo);
      }),
      z.number(),
    ])
    .refine((val) => !isNaN(val) && val >= 0.01, {
      message: "O valor deve ser maior que zero",
    }),
  descricao: z
    .string()
    .max(255, { message: "A descrição deve ter no máximo 255 caracteres" }),

  data_lancamento: z.string().min(1, {
    message: "A data de lançamento é obrigatória",
  }),

  tipo: z.enum(["ENTRADA", "SAIDA", "ESTORNO", "TRANSFERENCIA"]),

  cliente_id: z
    .union([z.string(), z.number()])
    .transform((val) => val ? Number(val) : null)
    .nullable()
    .optional(),

  plano_conta_id: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => val > 0, { message: "Plano de conta é obrigatório" }),

  caixa_id: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => val > 0, { message: "Caixa é obrigatório" }),

  lancamento_original_id: z
    .union([z.string(), z.number()])
    .transform((val) => val ? Number(val) : null)
    .nullable()
    .optional(),

  id_transferencia: z
    .union([z.string(), z.number()])
    .transform((val) => val ? Number(val) : null)
    .nullable()
    .optional(),

  motivo_estorno: z.string().nullable().optional(),

  motivo_transferencia: z.string().nullable().optional(),

  forma_pagamento: z.enum(["DINHEIRO", "CARTAO", "CHEQUE", "BOLETO", "PIX"]).optional(),

  status_pagamento: z.enum(["PENDENTE", "PAGO"]).optional(),

  agenda_id: z
    .union([z.string(), z.number()])
    .transform((val) => val ? Number(val) : null)
    .nullable()
    .optional(),

  usuario_id: z
    .string()
    .min(1, { message: "Usuário é obrigatório" }),
});

export const updateLancamentoSchema = createLancamentoSchema.partial();