import { z } from "zod";

export const createAlocacaoSchema = z.object({
  unidadesId: z.number().int().positive({
    message: "unidadesId deve ser um número inteiro positivo",
  }),
  especialidadesId: z.number().int().positive({
    message: "especialidadesId deve ser um número inteiro positivo",
  }),
  prestadoresId: z.number().int().positive({
    message: "prestadoresId deve ser um número inteiro positivo",
  }),
});

export const updateAlocacaoSchema = createAlocacaoSchema.partial();
