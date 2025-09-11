import * as z from "zod";
export const createLancamentoSchema = z.object({
  valor: z.number().min(0.01, { message: "O valor deve ser maior que zero" }),
  descricao: z.string().max(255, { message: "A descrição deve ter no máximo 255 caracteres" }).optional().or(z.literal("")),
  data_lancamento: z.string().min(1, { message: "A data de lançamento é obrigatória" }),
  cliente_id: z.union([z.string(), z.number()]).transform((val) => {
    if (!val || val === "0" || val === "" || val === 0) return null;
    return typeof val === 'string' ? parseInt(val) : val;
  }).nullable().optional(),
  plano_conta_id: z.union([z.string(), z.number()]).transform((val) => typeof val === 'string' ? parseInt(val) : val).refine((val) => val > 0, { message: "Plano de conta é obrigatório" }),
  caixa_id: z.union([z.string(), z.number()]).transform((val) => typeof val === 'string' ? parseInt(val) : val).refine((val) => val > 0, { message: "Caixa é obrigatório" }),
  lancamento_original_id: z.string().transform((val) => val ? parseInt(val) : null).nullable().optional(),
  id_transferencia: z.string().transform((val) => val ? parseInt(val) : null).nullable().optional(),
  motivo_estorno: z.string().nullable().optional(),
  motivo_transferencia: z.string().nullable().optional(),
  forma_pagamento: z.string().min(1, { message: "A forma de pagamento é obrigatória" }),
  status_pagamento: z.string().min(1, { message: "O status de pagamento é obrigatório" }),
  agenda_id: z.string().transform((val) => val ? parseInt(val) : null).nullable().optional(),
  usuario_id: z.union([z.string(), z.number()]).transform((val) => val && val !== "0" && val !== "" ? (typeof val === 'string' ? parseInt(val) : val) : null).nullable().optional(),
});
export const updateLancamentoSchema = createLancamentoSchema.partial();