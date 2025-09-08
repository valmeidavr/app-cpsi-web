import { z } from "zod";
export const createAgendaSchema = z.object({
  dtagenda: z.string(),
  horario: z.string({ required_error: "Horário é obrigatório" }), // Campo para seleção de horário no frontend
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
      invalid_type_error: "Situação inválida",
    }
  ).optional().default("AGENDADO"), // Opcional, padrão AGENDADO
  cliente_id: z
    .number()
    .int({ message: "Cliente deve ser um número inteiro" })
    .nullable(),
  convenio_id: z
    .number()
    .int({ message: "Convênio deve ser um número inteiro" }),
  tipo_cliente: z.enum(["SOCIO", "NSOCIO", "PARCEIRO", "FUNCIONARIO"], {
    required_error: "Tipo de cliente é obrigatório",
  }),
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
  tipo: z.enum(["PROCEDIMENTO", "ENCAIXE"]),
});
export const updateAgendaSchema = createAgendaSchema.partial();