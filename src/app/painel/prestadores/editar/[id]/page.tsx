"use client";
//react

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { redirect, useParams } from "next/navigation";
//Components
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
//helpers
import { handleCEPChange } from "@/app/helpers/handleCEP";
import {
  formatCPFInput,
  formatRGInput,
  formatTelefoneInput,
} from "@/app/helpers/format";
//Zod
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
//API
import { format, isValid, parse } from "date-fns";
import {
  getPrestadorById,
  updatePrestador,
} from "@/app/api/prestadores/action";
import { updatePrestadorSchema } from "@/app/api/prestadores/schema/formSchemaPretadores";
//Types
import { Prestador } from "@/app/types/Prestador";
const sexOptions = [
  { value: "Masculino", label: "Masculino" },
  { value: "Feminino", label: "Feminino" },
  { value: "outro", label: "Outro" },
];

export default function EditarPrestador() {
  const [prestador, setPrestador] = useState<Prestador | null>(null);
  const [loading, setLoading] = useState(false);
  const params = useParams();
  const prestadorId = Array.isArray(params.id) ? params.id[0] : params.id;

  const router = useRouter();

  //Definindo valores default com os dado do prestador
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

  //Formatação dos Campos
  useEffect(() => {
    if (prestador) {
      const formattedTelefone = formatTelefoneInput(prestador.telefone || "");
      const formattedCelular = formatTelefoneInput(prestador.celular || "");
      const formattedCPF = formatCPFInput(prestador.cpf || "");
      const formattedRG = formatRGInput(prestador.cpf || "");

      form.setValue("telefone", formattedTelefone);
      form.setValue("celular", formattedCelular);
      form.setValue("cpf", formattedCPF);
      form.setValue("rg", formattedRG);
      form.setValue("cep", prestador.cep || "");
      form.setValue("logradouro", prestador.logradouro || "");
      form.setValue("bairro", prestador.bairro || "");
      form.setValue("uf", prestador.uf || "");
      form.setValue("numero", prestador.numero || "");
      form.setValue("cidade", prestador.cidade || "");
    }
  }, [prestador, form]);

  //Função de submeter os dados
  const onSubmit = async (values: z.infer<typeof updatePrestadorSchema>) => {
    setLoading(true);
    console.log(values);
    try {
      if (prestadorId) await updatePrestador(prestadorId, values);

      const queryParams = new URLSearchParams();

      queryParams.set("type", "success");
      queryParams.set("message", "Prestador atualizado com sucesso!");

      router.push(`/painel/prestadores?${queryParams.toString()}`);
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

  useEffect(() => {
    async function fetchData() {
      try {
        if (!prestadorId) redirect("painel/prestadors");
        const data = await getPrestadorById(prestadorId);
        setPrestador(data);

        form.reset({
          nome: data.nome,
          dtnascimento: data.dtnascimento,
          rg: data.rg,
          cpf: data.cpf,
          sexo: data.sexo,
          cep: data.cep.replace(/^(\d{5})(\d{0,3})/, "$1-$2"),
          logradouro: data.logradouro,
          numero: data.numero,
          bairro: data.bairro,
          cidade: data.cidade,
          uf: data.uf,
          telefone: data.telefone,
          celular: data.celular,
          complemento: data.complemento,
        });
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      }
    }
    fetchData();
  }, []);

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Prestadores", href: "/painel/prestadores" },
          { label: "Editar Prestador" }, // Último item sem link
        ]}
      />

      <div className="flex flex-col flex-1 h-full">
        {" "}
        {/* overflow-hidden */}
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
                            let inputDate = e.target.value.replace(/\D/g, ""); // Remove todos os caracteres não numéricos
                            let formatted = inputDate
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
                             field.value? field.value.split("/")[2] : ""
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
                          let rawValue = e.target.value.replace(/\D/g, ""); // Remove caracteres não numéricos
                          const inputEvent = e.nativeEvent as InputEvent;
                          if (
                            inputEvent.inputType === "deleteContentBackward"
                          ) {
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
                render={({ field }) => {
                  useEffect(() => {
                    if (field.value) {
                      const rawValue = field.value.replace(/\D/g, "");

                      // Aplica a máscara automaticamente ao carregar o valor
                      if (rawValue.length <= 5) {
                        field.onChange(rawValue); // Sem formatação
                      } else {
                        const formattedValue = rawValue.replace(
                          /^(\d{5})(\d{0,3})/,
                          "$1-$2"
                        );
                        console.log(formattedValue);
                        field.onChange(formattedValue);
                      }
                    }
                  }, [field.value]); // Executa sempre que field.value mudar

                  return (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="00000-000"
                          maxLength={9}
                          value={field.value || ""}
                          onChange={(e) => {
                            // Quando o usuário digitar, remove caracteres não numéricos
                            let rawValue = e.target.value;

                            // Se o valor tiver mais de 5 caracteres, aplica a máscara
                            if (rawValue.length <= 5) {
                              field.onChange(rawValue); // Sem formatação ainda
                            } else {
                              // Aplica a máscara 'XXXXX-XXX'
                              const formattedValue = rawValue.replace(
                                /^(\d{5})(\d{0,3})/,
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
    </div>
  );
}
