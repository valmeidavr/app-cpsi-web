import { z } from "zod";

export const createAgendaSchema = z.object({
  dtagenda: z.string(),

  situacao: z.enum(
    [
      "AGENDADO",
      "LIVRE",
      "INATIVO",
      "FALTA",
      "FINALIZADO",
      "BLOQUEADO",
      "CONFIRMADO",
    ],
    {
      required_error: "Situação é obrigatória",
      invalid_type_error: "Situação inválida",
    }
  ),
  clientesId: z
    .number()
    .int({ message: "Cliente deve ser um número inteiro" })
    .nullable(),
  conveniosId: z
    .number()
    .int({ message: "Convênio deve ser um número inteiro" }),
  procedimentosId: z
    .number()
    .int({ message: "Procedimento deve ser um número inteiro" })
    .nullable(),
  expedientesId: z.number().optional(),
  prestadoresId: z.preprocess((val) => Number(val), z.number()),
  unidadesId: z.preprocess((val) => Number(val), z.number()),
  especialidadesId: z
    .number()
    .int({ message: "Especialidade deve ser um número inteiro" }),
  horario: z.string().optional().nullable(),
  tipo: z.enum(["PROCEDIMENTO", "ENCAIXE"]),
});
export const updateAgendaSchema = createAgendaSchema.partial();
