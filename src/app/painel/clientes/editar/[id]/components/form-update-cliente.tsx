"use client";
//components
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
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

//React
import { useRouter } from "next/navigation";
import type React from "react";
import { parse, isValid, format } from "date-fns";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

//Zod
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
//api
import { updateCliente } from "@/app/api/clientes/action";
import { formSchema } from "@/app/api/clientes/shema/formSchemaCliente";

import { Cliente } from "@/app/types/Cliente";
import { handleCEPChange } from "@/app/helpers/handleCEP";
import { formatCPFInput, formatTelefoneInput } from "@/app/helpers/format";
// Mockup de opções de sexo
const sexOptions = [
  { value: "Masculino", label: "Masculino" },
  { value: "Feminino", label: "Feminino" },
  { value: "outro", label: "Outro" },
];

export interface FormUpdateClienteProps {
  cliente: Cliente;
}

const FormUpdateCliente = ({ cliente }: FormUpdateClienteProps) => {
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  //Definindo valores default com os dado do cliente
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: cliente ?? "",
  });

  //Formatação dos Campos
  useEffect(() => {
    if (cliente) {
      const formattedPhone1 = formatTelefoneInput(cliente.telefone1 || "");
      const formattedPhone2 = formatTelefoneInput(cliente.telefone2 || "");
      const formattedCPF = formatCPFInput(cliente.cpf || "");

      form.setValue("telefone1", formattedPhone1);
      form.setValue("telefone2", formattedPhone2);
      form.setValue("cpf", formattedCPF);
      form.setValue("cep", cliente.cep || "");
      form.setValue("logradouro", cliente.logradouro || "");
      form.setValue("bairro", cliente.bairro || "");
      form.setValue("uf", cliente.uf || "");
      form.setValue("numero", cliente.numero || "");
      form.setValue("cidade", cliente.cidade || "");
    }
  }, [cliente, form]);

  //Função de submeter os dados
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      if (cliente.id) await updateCliente(cliente.id, values);

      const queryParams = new URLSearchParams();

      queryParams.set("type", "success");
      queryParams.set("message", "Cliente atualizado com sucesso!");

      router.push(`/painel/clientes?${queryParams.toString()}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
    setLoading(false);
  };

  //Função de buscar endereco com o CEP
  const handleCEPChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleCEPChange(e, form);
  };

  return (
    <div className="flex flex-col flex-1 h-full">
      {" "}
      {/* overflow-hidden */}
      <Form {...form}>
        <h1 className="text-2xl font-bold mb-4 mt-5">Editar Cliente</h1>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto space-y-4 p-2"
        >
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
                      value={field.value || ""}
                      className={`border ${
                        form.formState.errors.nome
                          ? "border-red-500"
                          : "border-gray-300"
                      } focus:ring-2 focus:ring-primary`}
                      onChange={field.onChange}
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
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      {...field}
                      value={field.value || ""}
                      className={`border ${
                        form.formState.errors.email
                          ? "border-red-500"
                          : "border-gray-300"
                      } focus:ring-2 focus:ring-primary`}
                      onChange={field.onChange}
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
              name="dtnascimento"
              render={({ field }) => {
                useEffect(() => {
                  if (field.value) {
                    const parsedDate = parse(
                      field.value,
                      "yyyy-MM-dd",
                      new Date()
                    );

                    if (isValid(parsedDate)) {
                      const formattedDate = format(parsedDate, "dd/MM/yyyy");
                      field.onChange(formattedDate);
                    }
                  }
                }, [field.value]);
                return (
                  <FormItem>
                    <FormLabel>Data de Nascimento *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="DD/MM/AAAA"
                        maxLength={10}
                        value={field.value || ""}
                        className={`border ${
                          form.formState.errors.dtnascimento
                            ? "border-red-500"
                            : "border-gray-300"
                        } focus:ring-2 focus:ring-primary`}
                        onChange={(e) => {
                          let inputDate = e.target.value.replace(/\D/g, "");
                          let formatted = inputDate
                            .replace(/(\d{2})(\d)/, "$1/$2")
                            .replace(/(\d{2})(\d)/, "$1/$2")
                            .slice(0, 10);

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

                          const year = parseInt(field.value.split("/")[2]);

                          if (
                            !isValid(parsedDate) ||
                            parsedDate > currentDate ||
                            year < minYear
                          ) {
                            field.onChange("");
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500 mt-1 font-light" />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="sexo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sexo *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl
                      className={
                        form.formState.errors.sexo
                          ? "border-red-500"
                          : "border-gray-300"
                      }
                    >
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
                      maxLength={14}
                      value={field.value || ""}
                      onChange={(e) => {
                        let rawValue = e.target.value.replace(/\D/g, ""); // Remove caracteres não numéricos
                        const inputEvent = e.nativeEvent as InputEvent;
                        if (inputEvent.inputType === "deleteContentBackward") {
                          // Se o usuário estiver apagando, não aplica a formatação
                          field.onChange(rawValue);
                        } else {
                          // Aplica a formatação normalmente
                          field.onChange(formatCPFInput(rawValue));
                        }
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
                      value={field.value || ""}
                      onChange={(e) => {
                        let rawValue = e.target.value.replace(/\D/g, ""); // Remove caracteres não numéricos
                        const inputEvent = e.nativeEvent as InputEvent;

                        if (inputEvent.inputType === "deleteContentBackward") {
                          // Se o usuário estiver apagando, não aplica a formatação
                          field.onChange(rawValue);
                        } else {
                          // Aplica a máscara ao digitar
                          const formattedValue = rawValue.replace(
                            /^(\d{5})(\d)/,
                            "$1-$2"
                          );
                          field.onChange(formattedValue);
                        }

                        // Chama a função para buscar o endereço baseado no CEP digitado
                        handleCEPChangeHandler(e);
                      }}
                      className={`border ${
                        form.formState.errors.cep
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
              name="logradouro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logradouro</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
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
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
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
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
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
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
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
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl
                      className={
                        form.formState.errors.uf
                          ? "border-red-500"
                          : "border-gray-300"
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[
                        "AC",
                        "AL",
                        "AP",
                        "AM",
                        "BA",
                        "CE",
                        "DF",
                        "ES",
                        "GO",
                        "MA",
                        "MT",
                        "MS",
                        "MG",
                        "PA",
                        "PB",
                        "PR",
                        "PE",
                        "PI",
                        "RJ",
                        "RN",
                        "RS",
                        "RO",
                        "RR",
                        "SC",
                        "SP",
                        "SE",
                        "TO",
                      ].map((estado) => (
                        <SelectItem key={estado} value={estado}>
                          {estado}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />
          </div>
          {/* 🔹 Linha 4: Telefone, Celular, Número do SUS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="telefone1"
              render={({ field }) => {
                useEffect(() => {
                  if (field.value) {
                    const parsedDate = parse(
                      field.value,
                      "yyyy-MM-dd",
                      new Date()
                    );

                    if (isValid(parsedDate)) {
                      const formattedDate = format(parsedDate, "dd/MM/yyyy");
                      field.onChange(formattedDate);
                    }
                  }
                }, [field.value]);

                return (
                  <FormItem>
                    <FormLabel>Telefone 1 *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Telefone"
                        maxLength={15}
                        value={field.value || ""}
                        onChange={(e) => {
                          const formattedPhone = formatTelefoneInput(
                            e.target.value
                          );
                          field.onChange(formattedPhone);
                        }}
                        className={`border ${
                          form.formState.errors.telefone1
                            ? "border-red-500"
                            : "border-gray-300"
                        } focus:ring-2 focus:ring-primary`}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500 mt-1 font-light" />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="telefone2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone 2</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Telefone"
                      maxLength={15}
                      value={field.value || ""}
                      onChange={(e) => {
                        const formattedPhone = formatTelefoneInput(
                          e.target.value
                        );
                        field.onChange(formattedPhone);
                      }}
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
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Atualizando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Atualizar
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default FormUpdateCliente;
