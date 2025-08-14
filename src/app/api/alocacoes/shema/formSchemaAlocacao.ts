import { z } from "zod";

export const createAlocacaoSchema = z.object({
  especialidade_id: z.preprocess(
    (val) => Number(val),
    z.number().min(1, "Especialidade obrigatória")
  ),
  unidade_id: z.preprocess(
    (val) => Number(val),
    z.number().min(1, "Unidade obrigatória")
  ),
  prestador_id: z.preprocess((val) => Number(val), z.number()).nullable(),
});

export const updateAlocacaoSchema = createAlocacaoSchema.partial();
