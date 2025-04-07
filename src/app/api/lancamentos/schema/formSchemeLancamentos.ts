import * as z from "zod";

export const formSchema = z.object({
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

  clientes_Id: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .optional().nullable(),

  plano_contas_id: z
    .union([z.string(), z.number()])
    .refine((val) => Number(val) > 0, {
      message: "O plano de contas é obrigatório",
    })
    .transform((val) => Number(val)),

  caixas_id: z
    .union([z.string(), z.number()])
    .refine((val) => Number(val) > 0, {
      message: "O campo caixa é obrigatório",
    })
    .transform((val) => Number(val)),

  lancamentos_original_id: z.number().nullable().optional(),

  id_transferencia: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .nullable()
    .optional(),

  motivo_estorno: z.string().nullable().optional(),

  motivo_transferencia: z.string().nullable().optional(),

  forma_pagamento: z.enum(["DINHEIRO", "CARTAO", "CHEQUE", "BOLETO", "PIX"], {
    required_error: "A forma de pagamento é obrigatório",
    invalid_type_error: "Forma de pagamento inválido",
  }),

  status_pagamento: z.enum(["PENDENTE", "PAGO"], {
    required_error: "Status de pagamento é obrigatório",
    invalid_type_error: "Status inválido",
  }),

  agendas_id: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .nullable()
    .optional(),

  usuario_id: z
    .union([z.string(), z.number()])
    .refine((val) => Number(val) > 0, {
      message: "O campo usuários é obrigatório",
    })
    .transform((val) => Number(val)),
});
