import * as z from "zod";
export const createLancamentoSchema = z.object({
  valor: z.number().min(0.01, { message: "O valor deve ser maior que zero" }),
  descricao: z.string().max(255, { message: "A descrição deve ter no máximo 255 caracteres" }),
  data_lancamento: z.string().min(1, { message: "A data de lançamento é obrigatória" }),
  cliente_id: z.number().nullable().optional(),
  plano_conta_id: z.number().min(1, { message: "Plano de conta é obrigatório" }),
  caixa_id: z.number().min(1, { message: "Caixa é obrigatório" }),
  lancamento_original_id: z.number().nullable().optional(),
  id_transferencia: z.number().nullable().optional(),
  motivo_estorno: z.string().nullable().optional(),
  motivo_transferencia: z.string().nullable().optional(),
  forma_pagamento: z.string().nullable().optional(),
  status_pagamento: z.string().nullable().optional(),
  agenda_id: z.number().nullable().optional(),
  usuario_id: z.string().nullable().optional(),
});
export const updateLancamentoSchema = createLancamentoSchema.partial();