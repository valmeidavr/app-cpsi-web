import { z } from "zod";
export const createValorProcedimentoSchema = z.object({
  id: z.number().int().optional(),
  convenio_id: z.coerce.number().min(1, "Convênio é obrigatório"),
  tipo_cliente: z.enum(["SOCIO", "NSOCIO", "FUNCIONARIO", "PARCEIRO"]),
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
  tipo: z.enum(["SOCIO", "NSOCIO", "FUNCIONARIO", "PARCEIRO", "PARTICULAR", "CONVENIO"]),
  tabela_faturamento_id: z.coerce.number().min(1, "Tabela é obrigatória"),
  procedimento_id: z.coerce.number().min(1, "Procedimento é obrigatório"),
});
export const updateValorProcedimentoSchema =
  createValorProcedimentoSchema.partial();