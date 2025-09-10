import { z } from "zod";
export const createValorProcedimentoSchema = z.object({
  id: z.number().int().optional(),
  convenio_id: z.coerce.number().optional(), // Opcional para formulário
  tipo_cliente: z.enum(["SOCIO", "NSOCIO", "FUNCIONARIO", "PARCEIRO"]).optional().refine((val) => val !== undefined, {
    message: "Tipo de cliente é obrigatório",
  }),
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
      z.undefined()
    ])
    .refine((val) => val !== undefined && !isNaN(val as number) && (val as number) >= 0.01, {
      message: "O valor deve ser maior que zero",
    }),
  tabela_faturamento_id: z.coerce.number().min(1, "Tabela é obrigatória"),
  procedimento_id: z.coerce.number().min(1, "Procedimento é obrigatório"),
});
export const updateValorProcedimentoSchema =
  createValorProcedimentoSchema.partial();