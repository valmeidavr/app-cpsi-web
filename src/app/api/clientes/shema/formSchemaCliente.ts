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
    .min(10, { message: "O campo é obrigatório" })
    .refine(
      (value) => {
        const parsedDate = parse(value, "dd/MM/yyyy", new Date());
        const currentDate = new Date();
        const minYear = 1920;
        const year = parseInt(value.split("/")[2]);
        return (
          isValid(parsedDate) && parsedDate <= currentDate && year >= minYear
        );
      },
      {
        message: "Data inválida ou fora do intervalo permitido (1920 até hoje)",
      }
    )
    .transform((val) =>
      format(parse(val, "dd/MM/yyyy", new Date()), "yyyy-MM-dd")
    )
    .default(""),
  sexo: z.string().min(1, { message: "Sexo é obrigatório" }).default(""),
  cpf: z.string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, {
      message: "Formato de CPF inválido",
    })
    .refine((value) => validarCPF(value), {
      message: "CPF inválido - dígitos verificadores incorretos",
    }),
  cep: z.string().optional(),
  tipo: z.union([
    z.nativeEnum(TipoCliente),
    z.string().refine((val) => Object.values(TipoCliente).includes(val as TipoCliente), {
      message: "Tipo de cliente inválido"
    }),
    z.number().refine((val) => val >= 0 && val < Object.keys(TipoCliente).length, {
      message: "Tipo de cliente inválido"
    })
  ], {
    required_error: "Tipo de cliente é obrigatório",
    invalid_type_error: "Tipo de cliente inválido",
  }).transform((val) => {
    if (typeof val === 'number') {
      const enumValues = Object.values(TipoCliente);
      return enumValues[val] || TipoCliente.SOCIO;
    }
    return val;
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