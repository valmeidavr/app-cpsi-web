import { z } from "zod";

export const createAlocacaoSchema = z.object({
  unidadesId: z.preprocess((val) => Number(val), z.number()),
  especialidadesId:z.preprocess((val) => Number(val), z.number()),
  prestadoresId: z.preprocess((val) => Number(val), z.number()),
});

export const updateAlocacaoSchema = createAlocacaoSchema.partial();
