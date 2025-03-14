import * as z from "zod";
import { parse, isValid } from "date-fns";

export const formSchema = z.object({
  nome: z.string().min(2, { message: "Nome é obrigatório" }),
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
    .default(""),
  sexo: z.string().min(1, { message: "Sexo é obrigatório" }).default(""),
  cpf: z.string().min(11, { message: "Mínimo 11 caracteres" }),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  telefone1: z.string().min(11, { message: "Telefone é obrigatório" }),
  telefone2: z.string().optional(),
});
