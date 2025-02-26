"use client";

import type React from "react";
import { format, parse, isValid } from "date-fns";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { Save, Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// Mockup data
const educationLevels = [
  { value: "fundamental", label: "Ensino Fundamental" },
  { value: "medio", label: "Ensino Médio" },
  { value: "superior", label: "Ensino Superior" },
  { value: "pos_graduacao", label: "Pós-Graduação" },
];

const physicalActivities = [
  { value: "sim", label: "Sim" },
  { value: "nao", label: "Não" },
];

const utilizationSectors = [
  { value: "saude", label: "Saúde" },
  { value: "educacao", label: "Educação" },
  { value: "esporte", label: "Esporte" },
  { value: "cultura", label: "Cultura" },
];

// Mockup de opções de sexo
const sexOptions = [
  { value: "masculino", label: "Masculino" },
  { value: "feminino", label: "Feminino" },
  { value: "outro", label: "Outro" },
];

// Schema de validação com `Zod`
const formSchema = z.object({
  nome: z.string().min(2, { message: "Nome é obrigatório" }),
  email: z
    .string()
    .min(1, { message: "O campo é obrigatório" }) // Exige pelo menos 1 caractere
    .email({ message: "Email inválido" })
    .default(""), // Valida formato de email
  dataNascimento: z
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
  cpf: z.string().min(11, { message: "Minímo 11 Cararacteres" }),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  uf: z.string().optional(),
  telefone1: z.string().optional(),
  telefone2: z.string().optional(),
  numeroSUS: z.string().optional(),
  escolaridade: z.string().optional(),
  praticaAtividadeFisica: z.string().optional(),
  tempoAtividadeFisica: z.string().optional(),
  setoresUtilizacao: z.string().optional(),
  observacao: z.string().optional(),
});

// Helper function to format phone number
const formatPhone = (value: string) => {
  return value
    .replace(/\D/g, "") // Remove tudo que não for número
    .replace(/^(\d{2})(\d)/, "($1) $2") // Adiciona parênteses no DDD
    .replace(/(\d{4,5})(\d{4})$/, "$1-$2") // Adiciona o traço
    .slice(0, 15); // Limita o tamanho máximo
};

// Helper function to format CEP
const formatCEP = (value: string) => {
  return value
    .replace(/\D/g, "") // Remove tudo que não for número
    .replace(/^(\d{5})(\d{1,3})?$/, "$1-$2") // Insere a máscara corretamente
    .slice(0, 9); // Limita a 9 caracteres (00000-000)
};

export default function CustomerRegistrationForm() {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      nome: "",
      cpf: "",
      cep: "",
      logradouro: "",
      numero: "",
      bairro: "",
      cidade: "",
      uf: "",
      telefone1: "",
      telefone2: "",
      numeroSUS: "",
      escolaridade: "",
      praticaAtividadeFisica: "",
      tempoAtividadeFisica: "",
      setoresUtilizacao: "",
      observacao: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    // Here you would typically send the form data to your backend
    console.log(values);
    setLoading(false);
  };

  const handleCEPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let rawCEP = e.target.value;
    let formattedCEP = formatCEP(rawCEP); // Aplica a máscara

    form.setValue("cep", formattedCEP); // Atualiza o estado do React Hook Form

    const onlyNumbers = formattedCEP.replace(/\D/g, ""); // Remove caracteres não numéricos

    if (onlyNumbers.length === 8) {
      try {
        const response = await fetch(
          `https://viacep.com.br/ws/${onlyNumbers}/json/`
        );
        const data = await response.json();

        if (!data.erro) {
          form.setValue("logradouro", data.logradouro || "");
          form.setValue("bairro", data.bairro || "");
          form.setValue("cidade", data.localidade || "");
          form.setValue("uf", data.uf || "");
          form.clearErrors("cep"); // Remove o erro se o CEP for válido
        } else {
          form.setError("cep", {
            type: "manual",
            message: "CEP não encontrado",
          });
        }
      } catch (error) {
        form.setError("cep", {
          type: "manual",
          message: "Erro ao buscar CEP. Tente novamente.",
        });
      }
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full">
      {" "}
      {/* overflow-hidden */}
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Clientes", href: "/painel/clientes" },
          { label: "Novo Cliente" }, // Último item sem link
        ]}
      />
      <Form {...form}>
        <h1 className="text-2xl font-bold mb-4 mt-5">Novo Cliente</h1>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto space-y-4 p-2"
        >
          {/* 🔹 Linha 1: Nome + Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className={`border ${
                        form.formState.errors.nome
                          ? "border-red-500"
                          : "border-gray-300"
                      } focus:ring-2 focus:ring-primary`}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      {...field}
                      className={`border ${
                        form.formState.errors.email
                          ? "border-red-500"
                          : "border-gray-300"
                      } focus:ring-2 focus:ring-primary`}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />
          </div>
          {/* 🔹 Linha 2: Data de nascimento + Sexo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="dataNascimento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Nascimento *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="DD/MM/AAAA"
                      maxLength={10}
                      value={field.value}
                      className={`border ${
                        form.formState.errors.dataNascimento
                          ? "border-red-500"
                          : "border-gray-300"
                      } focus:ring-2 focus:ring-primary`}
                      onChange={(e) => {
                        let inputDate = e.target.value.replace(/\D/g, ""); // Remove não numéricos
                        let formatted = inputDate
                          .replace(/(\d{2})(\d)/, "$1/$2") // Adiciona primeira barra "/"
                          .replace(/(\d{2})(\d)/, "$1/$2") // Adiciona segunda barra "/"
                          .slice(0, 10); // Limita a 10 caracteres (DD/MM/AAAA)

                        field.onChange(formatted);
                      }}
                      onBlur={() => {
                        const parsedDate = parse(
                          field.value,
                          "dd/MM/yyyy",
                          new Date()
                        );
                        const currentDate = new Date();
                        const minYear = 1920;

                        // Obtém o ano digitado
                        const year = parseInt(field.value.split("/")[2]);

                        // Verifica se a data é válida
                        if (
                          !isValid(parsedDate) || // Se a data não for válida
                          parsedDate > currentDate || // Se for maior que a data atual
                          year < minYear // Se for menor que 1920
                        ) {
                          field.onChange(""); // Limpa o campo
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sexo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sexo *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sexOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />
          </div>
          {/* 🔹 Linha 2: CPF, CEP, Logradouro, Número */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Somente Números"
                      maxLength={11}
                      value={field.value}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/\D/g, ""); // Remove tudo que não for número
                        field.onChange(numericValue);
                      }}
                      className={`border ${
                        form.formState.errors.cpf
                          ? "border-red-500"
                          : "border-gray-300"
                      } focus:ring-2 focus:ring-primary`}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cep"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="00000-000"
                      maxLength={9}
                      {...field}
                      className={`border ${
                        form.formState.errors.cep
                          ? "border-red-500"
                          : "border-gray-300"
                      } focus:ring-2 focus:ring-primary`}
                      onChange={(e) => {
                        handleCEPChange(e); // Aplica a máscara e busca o endereço
                      }}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logradouro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logradouro</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="numero"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />
          </div>
          {/* 🔹 Linha 3: Bairro, Cidade, UF */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="bairro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bairro</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="uf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>UF</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />
          </div>
          {/* 🔹 Linha 4: Telefone, Celular, Número do SUS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="telefone1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="(00) 0000-0000"
                      maxLength={15}
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(formatPhone(e.target.value))
                      }
                      className={`border ${
                        form.formState.errors.telefone1
                          ? "border-red-500"
                          : "border-gray-300"
                      } focus:ring-2 focus:ring-primary`}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefone2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone 2</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(formatPhone(e.target.value))
                      }
                      className={`border ${
                        form.formState.errors.telefone2
                          ? "border-red-500"
                          : "border-gray-300"
                      } focus:ring-2 focus:ring-primary`}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="numeroSUS"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número do SUS</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />
          </div>
          {/* 🔹 Linha 5: Escolaridade, Prática de atividade física, Tempo de atividade física, Setores de Utilização */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <FormField
              control={form.control}
              name="escolaridade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Escolaridade</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolaridade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {educationLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="praticaAtividadeFisica"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pratica atividade física?</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sim ou Não" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {physicalActivities.map((activity) => (
                        <SelectItem key={activity.value} value={activity.value}>
                          {activity.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tempoAtividadeFisica"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tempo de atividade física</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="setoresUtilizacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Setores de Utilização</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />
          </div>
          {/* 🔹 Linha 6: Observação */}
          <FormField
            control={form.control}
            name="observacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observação</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Digite suas observações aqui"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-red-500 mt-1 font-light" />
              </FormItem>
            )}
          />
    
          <Button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
