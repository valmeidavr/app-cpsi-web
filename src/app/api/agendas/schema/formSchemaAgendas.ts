import { z } from "zod";

export const createAgendaSchema = z.object({
  dtagenda: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Este campo é obrigatório",
  }),

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
    .int({ message: "Convênio deve ser um número inteiro" })
    .nullable(),
  procedimentosId: z
    .number()
    .int({ message: "Procedimento deve ser um número inteiro" })
    .nullable(),
  expedientesId: z
    .number()
    .int({ message: "Expediente deve ser um número inteiro" })
    .min(1, "Campo obrigatório"),
  prestadoresId: z
    .number()
    .int({ message: "Prestador deve ser um número inteiro" })
    .min(1, "Campo obrigatório"),
  unidadesId: z
    .number()
    .int({ message: "Unidade deve ser um número inteiro" })
    .min(1, "Campo obrigatório"),
  especialidadesId: z
    .number()
    .int({ message: "Especialidade deve ser um número inteiro" })
    .min(1, "Campo obrigatório"),
});
export const updateAgendaSchema = createAgendaSchema.partial();
