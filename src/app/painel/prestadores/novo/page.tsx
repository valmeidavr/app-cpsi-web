"use client";

//React
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

//Zod
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

//Components
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";
import Breadcrumb from "@/components/ui/Breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

//API

//Helpers
import { useRouter } from "next/navigation";
import { createPrestador } from "@/app/api/prestadores/action";
import { formSchema } from "@/app/api/prestadores/schema/formSchemaPretadores";
import { handleCEPChange } from "@/app/helpers/handleCEP";
import { http } from "@/util/http";
import { isValid, parse } from "date-fns";
import {
  formatCPFInput,
  formatRGInput,
  formatTelefoneInput,
} from "@/app/helpers/format";
const sexOptions = [
  { value: "Masculino", label: "Masculino" },
  { value: "Feminino", label: "Feminino" },
  { value: "outro", label: "Outro" },
];

export default function NovoPrestador() {
  const [loading, setLoading] = useState(false);
  const [isCheckingCpf, setIsCheckingCpf] = useState<Boolean>(false);
  const [cpfError, setCpfError] = useState<string | null>("");
  const [timeoutCpfId, setTimeoutCpfId] = useState<NodeJS.Timeout | null>(null);

  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      nome: "",
      rg: "",
      cpf: "",
      sexo: "",
      dtnascimento: "",
      cep: "",
      logradouro: "",
      numero: "",
      bairro: "",
      cidade: "",
      uf: "",
      telefone: "",
      celular: "",
      complemento: "",
    },
  });

  const handleCEPChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleCEPChange(e, form);
  };

  const checkCpf = async (cpf: string) => {
    if (!cpf) {
      setCpfError(null);
      return;
    }

    setIsCheckingCpf(true);
    try {
      const { data } = await http.get(
        `http://localhost:3000/prestadores/findByCpf/${cpf}`
      );
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
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      await createPrestador(values);
      router.push("/painel/prestadores?type=success&message=salvo com sucesso");
    } catch (error) {
      toast.error("Erro ao salvar prestador");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Prestadores", href: "/painel/prestadores" },
          { label: "Novo Prestador" }, // Último item sem link
        ]}
      />
      <Form {...form}>
        <h1 className="text-2xl font-bold mb-4 mt-5">Novo Prestador</h1>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto space-y-4 p-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      className={
                        form.formState.errors.nome
                          ? "border-red-500"
                          : "border-gray-300"
                      }
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
              name="rg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RG *</FormLabel>
                  <FormControl>
                    <Input
                      maxLength={12}
                      value={field.value || ""}
                      onChange={(e) => {
                        let rawValue = e.target.value.replace(/\D/g, "");
                        const inputEvent = e.nativeEvent as InputEvent;

                        if (inputEvent.inputType === "deleteContentBackward") {
                          field.onChange(rawValue);
                        } else {
                          field.onChange(formatRGInput(rawValue));
                        }
                      }}
                      className={
                        form.formState.errors.rg
                          ? "border-red-500"
                          : "border-gray-300"
                      }
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF *</FormLabel>
                  <FormControl>
                    <Input
                      maxLength={14}
                      value={field.value || ""}
                      onChange={(e) => {
                        handlecpfChange(e);
                        let rawValue = e.target.value.replace(/\D/g, "");
                        const inputEvent = e.nativeEvent as InputEvent;

                        if (inputEvent.inputType === "deleteContentBackward") {
                          field.onChange(rawValue);
                        } else {
                          field.onChange(formatCPFInput(rawValue));
                        }
                      }}
                      className={
                        form.formState.errors.cpf
                          ? "border-red-500"
                          : "border-gray-300"
                      }
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <FormField
              control={form.control}
              name="cep"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP</FormLabel>
                  <FormControl>
                    <Input
                      maxLength={9}
                      value={field.value || ""}
                      onChange={(e) => handleCEPChangeHandler(e)}
                      className={
                        form.formState.errors.cep
                          ? "border-red-500"
                          : "border-gray-300"
                      }
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="celular"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Celular *</FormLabel>
                  <FormControl>
                    <Input
                      maxLength={15}
                      value={field.value || ""}
                      onChange={(e) => {
                        const formattedPhone = formatTelefoneInput(
                          e.target.value
                        );
                        field.onChange(formattedPhone);
                      }}
                      className={
                        form.formState.errors.celular
                          ? "border-red-500"
                          : "border-gray-300"
                      }
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 mt-1 font-light" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input
                      maxLength={15}
                      value={field.value || ""}
                      onChange={(e) => {
                        const formattedPhone = formatTelefoneInput(
                          e.target.value
                        );
                        field.onChange(formattedPhone);
                      }}
                      className={
                        form.formState.errors.telefone
                          ? "border-red-500"
                          : "border-gray-300"
                      }
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
