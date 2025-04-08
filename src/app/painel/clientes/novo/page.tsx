"use client";
//React
import type React from "react";
import { parse, isValid } from "date-fns";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

//Zod
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
//Components
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
import { toast } from "sonner";

//API
import { createCliente, findByCpf, findByEmail } from "@/app/api/clientes/action";


//helpers
import { handleCEPChange } from "@/app/helpers/handleCEP";
import { formatCPFInput, formatTelefoneInput } from "@/app/helpers/format";
import { http } from "@/util/http";
import { createClienteSchema } from "@/app/api/clientes/shema/formSchemaCliente";

// Mockup de opções de sexo
const sexOptions = [
  { value: "Masculino", label: "Masculino" },
  { value: "Feminino", label: "Feminino" },
  { value: "outro", label: "Outro" },
];

export default function CustomerRegistrationForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [isCheckingEmail, setIsCheckingEmail] = useState<Boolean>(false);
  const [emailError, setEmailError] = useState<string | null>("");
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const [isCheckingCpf, setIsCheckingCpf] = useState<Boolean>(false);
  const [cpfError, setCpfError] = useState<string | null>("");
  const [timeoutCpfId, setTimeoutCpfId] = useState<NodeJS.Timeout | null>(null);

  const form = useForm<z.infer<typeof createClienteSchema>>({
    resolver: zodResolver(createClienteSchema),
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
      dtnascimento: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof createClienteSchema>) => {
    setLoading(true);
    if (emailError || cpfError) {
      toast.error("Corrija os erros antes de enviar o formulário.");
      return;
    }
    try {
      await createCliente(values);

      const currentUrl = new URL(window.location.href);
      const queryParams = new URLSearchParams(currentUrl.search);

      queryParams.set("type", "success");
      queryParams.set("message", "Cliente salvo com sucesso!");

      router.push(`/painel/clientes?${queryParams.toString()}`);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Erro ao salvar cliente";

      // Exibindo toast de erro
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
    setLoading(false);
  };

  const checkEmail = async (email: string) => {
    if (!email) {
      setEmailError(null);
      return;
    }

    setIsCheckingEmail(true);
    try {
      const { data } = await findByEmail(email);
      if (data) {
        setEmailError("Este email já está em uso.");
      } else {
        setEmailError(null);
      }
    } catch (error) {
      console.error("Erro ao verificar email:", error);
      setEmailError("Erro ao verificar email.");
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const checkCpf = async (cpf: string) => {
    if (!cpf) {
      setCpfError(null);
      return;
    }

    setIsCheckingCpf(true);
    try {
      const { data } = await findByCpf(cpf);
      if (data) {
        setCpfError("Este cpf já está em uso.");
      } else {
        setCpfError(null);
      }
    } catch (error) {
      console.error("Erro ao verificar cpf:", error);
      setCpfError("Erro ao verificar cpf.");
    } finally {
      setIsCheckingCpf(false);
    }
  };

  const handlecpfChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const cpf = event.target.value;
    form.setValue("cpf", cpf, { shouldValidate: true });

    if (timeoutCpfId) clearTimeout(timeoutCpfId);
    const newTimeoutCpfId = setTimeout(() => checkCpf(cpf), 500);
    setTimeoutCpfId(newTimeoutCpfId);
  };
  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const email = event.target.value;
    form.setValue("email", email, { shouldValidate: true });

    if (timeoutId) clearTimeout(timeoutId);
    const newTimeoutId = setTimeout(() => checkEmail(email), 500);
    setTimeoutId(newTimeoutId);
  };
  const handleCEPChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleCEPChange(e, form);
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
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm mt-1">
                    {form.formState.errors.nome?.message}
                  </FormMessage>
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
                      onChange={handleEmailChange}
                      value={field.value || ""}
                      className={`border ${
                        form.formState.errors.email
                          ? "border-red-500"
                          : "border-gray-300"
                      } focus:ring-2 focus:ring-primary`}
                    />
                  </FormControl>
                  {isCheckingEmail && (
                    <p className="text-gray-500 text-sm">
                      Verificando email...
                    </p>
                  )}
                  {emailError && (
                    <p className="text-red-500 text-sm">{emailError}</p>
                  )}
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Nascimento *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="DD/MM/AAAA"
                      maxLength={10}
                      value={field.value || ""}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, "");

                        if (value.length > 2) {
                          value = value.replace(/^(\d{2})/, "$1/");
                        }
                        if (value.length > 5) {
                          value = value.replace(/^(\d{2})\/(\d{2})/, "$1/$2/");
                        }

                        field.onChange(value);
                      }}
                      onBlur={() => {
                        if (!field.value) return;

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
                          field.onChange(""); // Limpa campo se a data for inválida
                        }
                      }}
                      className={`border ${
                        form.formState.errors.dtnascimento
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
                        handlecpfChange(e);
                        let rawValue = e.target.value.replace(/\D/g, ""); // Remove não numéricos
                        const inputEvent = e.nativeEvent as InputEvent; // Força o tipo correto

                        if (inputEvent.inputType === "deleteContentBackward") {
                          // Permite apagar sem reformatar
                          field.onChange(rawValue);
                        } else {
                          field.onChange(formatCPFInput(rawValue)); // Aplica a máscara
                        }
                      }}
                      className={`border ${
                        form.formState.errors.cpf
                          ? "border-red-500"
                          : "border-gray-300"
                      } focus:ring-2 focus:ring-primary`}
                    />
                  </FormControl>
                  {isCheckingCpf && (
                    <p className="text-gray-500 text-sm">Verificando CPF...</p>
                  )}
                  {cpfError && (
                    <p className="text-red-500 text-sm">{cpfError}</p>
                  )}
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
                        let rawValue = e.target.value.replace(/\D/g, ""); // Remove não numéricos
                        const inputEvent = e.nativeEvent as InputEvent;

                        if (inputEvent.inputType === "deleteContentBackward") {
                          // Permite apagar sem reformatar
                          field.onChange(rawValue);
                        } else {
                          field.onChange(
                            rawValue.replace(/^(\d{5})(\d)/, "$1-$2")
                          ); // Aplica a máscara ao digitar
                        }

                        // Chama a função handleCEPChangeHandler após atualizar o valor
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
              render={({ field }) => (
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
