import * as z from "zod";
import { parse, isValid, format } from "date-fns";
import { TipoCliente } from "@/app/types/Cliente";
import { validarCPF } from "@/app/helpers/cpfValidator";
export const createClienteSchema = z.object({
  nome: z
    .string()
    .min(3, { message: "O nome deve ter pelo menos 3 caracteres" }),
  email: z
    .string()
    .min(1, { message: "O campo é obrigatório" })
    .email({ message: "Email inválido" })
    .default(""),
  dtnascimento: z
    .string()
    .min(8, { message: "Data de nascimento é obrigatória" })
    .refine(
      (value) => {
        // Validação: aceitar data em formato ISO (yyyy-MM-dd) ou brasileiro (dd/MM/yyyy)
        const dateRegexISO = /^\d{4}-\d{2}-\d{2}$/;
        const dateRegexBR = /^\d{2}\/\d{2}\/\d{4}$/;
        
        if (!dateRegexISO.test(value) && !dateRegexBR.test(value)) {
          return false;
        }
        
        let testDate: Date;
        let year: number;
        
        if (dateRegexISO.test(value)) {
          // Formato ISO: yyyy-MM-dd
          testDate = new Date(value);
          year = testDate.getFullYear();
        } else if (dateRegexBR.test(value)) {
          // Para formato brasileiro, converter e testar
          const [day, month, yearStr] = value.split('/');
          year = parseInt(yearStr);
          testDate = new Date(year, parseInt(month) - 1, parseInt(day));
        } else {
          // Fallback case to ensure testDate is always defined
          return false;
        }
        
        const currentYear = new Date().getFullYear();
        const isValidDate = !isNaN(testDate.getTime());
        const isYearInRange = year >= 1920 && year <= currentYear;
        const isFutureDate = testDate > new Date();
        
        return isValidDate && isYearInRange && !isFutureDate;
      },
      {
        message: "Data inválida ou fora do intervalo permitido (1920 até hoje)",
      }
    ),
  sexo: z.string().min(1, { message: "Sexo é obrigatório" }).default(""),
  cpf: z.string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, {
      message: "Formato de CPF inválido",
    })
    .refine((value) => validarCPF(value), {
      message: "CPF inválido - dígitos verificadores incorretos",
    }),
  cep: z.string().optional(),
  tipo: z.string({
    required_error: "Tipo de cliente é obrigatório",
    invalid_type_error: "Tipo de cliente inválido",
  }).refine((val) => Object.values(TipoCliente).includes(val as TipoCliente), {
    message: "Tipo de cliente inválido"
  }),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  convenios: z.array(z.number()),
  desconto: z.record(z.number().optional()),
  telefone1: z
    .string()
    .regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, { message: "Telefone inválido" }),
  telefone2: z.string().optional(),
});
export const updateClienteSchema = createClienteSchema.partial();