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
  cliente_id: z
    .number()
    .int({ message: "Cliente deve ser um número inteiro" })
    .nullable(),
  convenio_id: z
    .number()
    .int({ message: "Convênio deve ser um número inteiro" }),
  procedimento_id: z
    .number()
    .int({ message: "Procedimento deve ser um número inteiro" })
    .nullable(),
  expediente_id: z.number().optional(),
  prestador_id: z.preprocess((val) => Number(val), z.number()),
  unidade_id: z.preprocess((val) => Number(val), z.number()),
  especialidade_id: z
    .number()
    .int({ message: "Especialidade deve ser um número inteiro" }),
  horario: z.string().optional().nullable(),
  tipo: z.enum(["PROCEDIMENTO", "ENCAIXE"]),
});
export const updateAgendaSchema = createAgendaSchema.partial();
