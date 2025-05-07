import { z } from "zod";

export const createAlocacaoSchema = z.object({
  especialidadesId: z.preprocess(
    (val) => Number(val),
    z.number().min(1, "Especialidade obrigatória")
  ),
  unidadesId: z.preprocess(
    (val) => Number(val),
    z.number().min(1, "Unidade obrigatória")
  ),
  prestadoresId: z.preprocess((val) => Number(val), z.number()).nullable(),
});

export const updateAlocacaoSchema = createAlocacaoSchema.partial();
