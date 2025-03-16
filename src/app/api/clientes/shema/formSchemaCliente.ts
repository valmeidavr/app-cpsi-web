import * as z from "zod";
import { parse, isValid, format } from "date-fns";

export const formSchema = z.object({
  nome: z
    .string()
    .min(3, { message: "O nome deve ter pelo menos 3 caracteres" })
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, {
      message: "O nome não pode conter números ou símbolos",
    }),

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

  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, {
    message: "Formato de CPF inválido",
  }),

  cep: z
    .string()
    .optional(),

  logradouro: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),

  telefone1: z
    .string()
    .regex(/^\(?\d{2}\)?\s?9?\d{4}-\d{4}$/, { message: "Telefone inválido" }),

  telefone2: z
    .string()
    .optional(),
});
