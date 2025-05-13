import { TipoCliente } from "@/app/types/ValorProcedimento";
import { z } from "zod";
export const createValorProcedimentoSchema = z.object({
  id: z.number().int().optional(),
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
  tipo: z.enum(["SOCIO", "NSOCIO", "FUNCIONARIO", "PARCEIRO"]),
  tabelaFaturamentosId: z.coerce.number(),
  procedimentosId: z.coerce.number(),
});

export const updateValorProcedimentoSchema =
  createValorProcedimentoSchema.partial();
