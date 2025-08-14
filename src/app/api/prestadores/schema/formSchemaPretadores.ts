import * as z from "zod";

export const createPrestadorSchema = z.object({
  nome: z
    .string()
    .min(3, { message: "O nome deve ter pelo menos 3 caracteres" })
,

  rg: z
    .string()
    .min(9, { message: "O RG deve ter pelo menos 9 caracteres" })
    .refine(
      (value) => {
        if (value) {
          return /^\d{2}\.\d{3}\.\d{3}-\d$/.test(value);
        }
        return true;
      },
      { message: "Formato de RG inválido" }
    ),

  cpf: z
    .string()
    .min(14, { message: "O CPF deve ter 14 caracteres" })
    .optional()
    .refine(
      (value) => {
        if (value) {
          return /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(value);
        }
        return true;
      },
      { message: "Formato de CPF inválido" }
    ),

  sexo: z.string().min(1, { message: "O campo sexo é obrigatório" }).optional(),

  dtnascimento: z
    .string()
    .min(2, { message: "O campo data de nascimento é obrigatório" })
    .refine(
      (value) => {
        if (!value) return true;
        
        // Aceitar formato DD/MM/AAAA
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
          return true;
        }
        
        // Aceitar formato YYYY-MM-AA (formato MySQL)
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return true;
        }
        
        return false;
      },
      { message: "Formato de data inválido. Use DD/MM/AAAA ou YYYY-MM-AA" }
    ),

  cep: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (value) {
          return /^\d{5}-\d{3}$/.test(value);
        }
        return true;
      },
      { message: "Formato de CEP inválido" }
    ),

  logradouro: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),

  telefone: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (value) {
          return /^\(\d{2}\) \d{4}-\d{4}$/.test(value);
        }
        return true;
      },
      { message: "Formato de telefone inválido" }
    ),

  celular: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (value) {
          return /^\(\d{2}\) \d{5}-\d{4}$/.test(value);
        }
        return true;
      },
      { message: "Formato de celular inválido" }
    ),

  complemento: z.string().optional(),
});
export const updatePrestadorSchema = createPrestadorSchema.partial();