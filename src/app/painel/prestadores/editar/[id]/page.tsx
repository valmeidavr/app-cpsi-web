"use client";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { redirect, useParams } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
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
import { handleCEPChange } from "@/app/helpers/handleCEP";
import {
  formatCPFInput,
  formatRGInput,
  formatTelefoneInput,
} from "@/app/helpers/format";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, isValid, parse } from "date-fns";
import { http } from "@/util/http";
import { updatePrestadorSchema } from "@/app/api/prestadores/schema/formSchemaPretadores";
import { Prestador } from "@/app/types/Prestador";
const sexOptions = [
  { value: "Masculino", label: "Masculino" },
  { value: "Feminino", label: "Feminino" },
  { value: "outro", label: "Outro" },
];
export default function EditarPrestador() {
  const [loading, setLoading] = useState(false); // Para o botão de submit
  const [carregando, setCarregando] = useState(true); // Para o loader inicial da página
  const params = useParams();
  const prestadorId = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const form = useForm<z.infer<typeof updatePrestadorSchema>>({
    resolver: zodResolver(updatePrestadorSchema),
    mode: "onChange",
    defaultValues: {
      nome: "",
      dtnascimento: "",
      rg: "",
      cpf: "",
      sexo: "",
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
  useEffect(() => {
    async function fetchData() {
      try {
        if (!prestadorId) {
          toast.error("ID do prestador não encontrado.");
          redirect("/painel/prestadores");
          return;
        }
        const response = await fetch(`/api/prestadores/${prestadorId}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Erro ao carregar dados do prestador");
        }
        let formattedBirthDate = "";
        if (data.dtnascimento) {
          let birthDate = null;
          if (typeof data.dtnascimento === 'string' && data.dtnascimento.includes('-')) {
            birthDate = new Date(data.dtnascimento);
          }
          else if (typeof data.dtnascimento === 'string' && data.dtnascimento.includes('/')) {
            birthDate = parse(data.dtnascimento, 'dd/MM/yyyy', new Date());
          }
          else if (data.dtnascimento instanceof Date) {
            birthDate = data.dtnascimento;
          }
          if (birthDate && isValid(birthDate)) {
            formattedBirthDate = format(birthDate, "dd/MM/yyyy");
          }
        }
        const formattedData = {
          ...data,
          dtnascimento: formattedBirthDate,
          cpf: formatCPFInput(data.cpf || ""),
          rg: formatRGInput(data.rg || ""),
          celular: formatTelefoneInput(data.celular || ""),
          telefone: formatTelefoneInput(data.telefone || ""),
          cep: data.cep ? data.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2") : "",
        };
        form.reset(formattedData);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erro ao carregar prestador");
      } finally {
        setCarregando(false); // Desativa o loader da página
      }
    }
    fetchData();
  }, [prestadorId, form]); // A dependência no form.reset é importante
  const onSubmit = async (values: z.infer<typeof updatePrestadorSchema>) => {
    setLoading(true);
    try {
      if (!prestadorId) throw new Error("ID do prestador não encontrado.");
      const response = await fetch(`/api/prestadores/${prestadorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || "Erro ao atualizar prestador.");
      }
      toast.success("Prestador atualizado com sucesso!");
      router.push(`/painel/prestadores`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar prestador");
    } finally {
      setLoading(false);
    }
  };
  const handleCEPChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawCEP = e.target.value;
    const onlyNumbers = rawCEP.replace(/\D/g, "");
    if (onlyNumbers.length === 8) {
      fetch(`https://viacep.com.br/ws/${onlyNumbers}/json/`)
        .then(response => response.json())
        .then(data => {
          if (!data.erro) {
            form.setValue("logradouro", data.logradouro || "");
            form.setValue("bairro", data.bairro || "");
            form.setValue("cidade", data.localidade || "");
            form.setValue("uf", data.uf || "");
            form.clearErrors("cep");
          } else {
            form.setError("cep", {
              type: "manual",
              message: "CEP não encontrado",
            });
          }
        })
        .catch(() => {
          form.setError("cep", {
            type: "manual",
            message: "Erro ao buscar CEP. Tente novamente.",
          });
        });
    }
  };
  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Prestadores", href: "/painel/prestadores" },
          { label: "Editar Prestador" }, // Último item sem link
        ]}
      />
      {}
      {carregando ? (
        <div className="flex justify-center items-center w-full h-40">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Carregando ...</span>
        </div>
      ) : (
        <div className="flex flex-col flex-1 h-full">
          {" "}
          {}
          <Form {...form}>
            <h1 className="text-2xl font-bold mb-4 mt-5">Editar Prestador</h1>
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
                  name="dtnascimento"
                  render={({ field }) => (
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
                            const inputDate = e.target.value.replace(/\D/g, ""); // Remove todos os caracteres não numéricos
                            const formatted = inputDate
                              .replace(/(\d{2})(\d)/, "$1/$2")
                              .replace(/(\d{2})(\d)/, "$1/$2")
                              .slice(0, 10); // Garante que não haja mais de 10 caracteres
                            field.onChange(formatted);
                          }}
                          onBlur={() => {
                            const parsedDate = parse(
                              field.value as string,
                              "dd/MM/yyyy",
                              new Date()
                            );
                            const currentDate = new Date();
                            const minYear = 1920;
                            const year = parseInt(
                              field.value ? field.value.split("/")[2] : ""
                            );
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
              {}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                            const rawValue = e.target.value.replace(/\D/g, "");
                            const inputEvent = e.nativeEvent as InputEvent;
                            if (
                              inputEvent.inputType === "deleteContentBackward"
                            ) {
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
                          placeholder="Somente Números"
                          maxLength={14}
                          value={field.value || ""}
                          onChange={(e) => {
                            const rawValue = e.target.value.replace(/\D/g, ""); // Remove caracteres não numéricos
                            const inputEvent = e.nativeEvent as InputEvent;
                            if (
                              inputEvent.inputType === "deleteContentBackward"
                            ) {
                              field.onChange(rawValue);
                            } else {
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
                  render={({ field }) => {
                    return (
                      <FormItem>
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="00000-000"
                            maxLength={9}
                            value={field.value || ""}
                            onChange={(e) => {
                              const rawValue = e.target.value;
                              if (rawValue.length <= 5) {
                                field.onChange(rawValue); // Sem formatação ainda
                              } else {
                                const formattedValue = rawValue.replace(
                                  /^(\d{5})(\d{0,3})/,
                                  "$1-$2"
                                );
                                field.onChange(formattedValue);
                              }
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
                    );
                  }}
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
              {}
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
              {}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="celular"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Celular*</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Celular"
                          maxLength={15}
                          value={field.value || ""}
                          onChange={(e) => {
                            const formattedPhone = formatTelefoneInput(
                              e.target.value
                            );
                            field.onChange(formattedPhone);
                          }}
                          className={`border ${
                            form.formState.errors.celular
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
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
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
                            form.formState.errors.telefone
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
      )}
    </div>
  );
}