"use client";
// React
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { redirect, useParams } from "next/navigation";
//Components
import { Button } from "@/components/ui/button";
import { Save, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import Breadcrumb from "@/components/ui/Breadcrumb";
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
import { format, isValid, parse } from "date-fns";
import { handleCEPChange } from "@/app/helpers/handleCEP";
import { formatCPFInput, formatTelefoneInput } from "@/app/helpers/format";
//Zod
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
//API
import { updateCliente } from "@/app/api/clientes/action";
import { getClienteById } from "@/app/api/clientes/action";
import { createClienteSchema } from "@/app/api/clientes/shema/formSchemaCliente";
//Types
import { Cliente, TipoCliente } from "@/app/types/Cliente";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Convenio } from "@/app/types/Convenios";
import { getConvenios } from "@/app/api/convenios/action";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

const sexOptions = [
  { value: "Masculino", label: "Masculino" },
  { value: "Feminino", label: "Feminino" },
  { value: "outro", label: "Outro" },
];

export default function EditarCliente() {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const params = useParams();
  const clienteId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const router = useRouter();
  const [loadingInativar, setLoadingInativar] = useState(false);

  //Definindo valores default com os dado do cliente
  const form = useForm<z.infer<typeof createClienteSchema>>({
    resolver: zodResolver(createClienteSchema),
    mode: "onChange",
    defaultValues: {
      nome: "",
      email: "",
      dtnascimento: "",
      sexo: "",
      tipo: TipoCliente.SOCIO,
      cpf: "",
      cep: "",
      logradouro: "",
      numero: "",
      bairro: "",
      cidade: "",
      uf: "",
      telefone1: "",
      telefone2: "",
      convenios: [],
      desconto: {},
    },
  });
  useEffect(() => {
    const body = document.body;

    if (isDialogOpen) {
      body.style.pointerEvents = "auto"; // Corrige o bug
    } else {
      body.style.pointerEvents = ""; // Reseta quando fecha
    }
  }, [isDialogOpen]);
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
  const onSubmit = async (values: z.infer<typeof createClienteSchema>) => {
    setLoading(true);
    try {
      // Garantir que todos os convênios selecionados tenham desconto definido
      const descontosPreenchidos: Record<string, number> = {};

      // Para cada convênio selecionado, garantir que tenha um desconto válido
      values.convenios.forEach((convenioId) => {
        const convenio = convenios.find(c => c.id === convenioId);
        if (convenio) {
          const descontoAtual = values.desconto[convenioId];
          // Se não há desconto definido ou é inválido, usar o desconto padrão do convênio
          if (
            descontoAtual === undefined ||
            descontoAtual === null ||
            isNaN(descontoAtual)
          ) {
            descontosPreenchidos[convenioId] = convenio.desconto;
          } else {
            descontosPreenchidos[convenioId] = descontoAtual;
          }
        }
      });

      const payload = {
        ...values,
        desconto: descontosPreenchidos,
      };
      if (!clienteId) throw new Error("ID do cliente não encontrado.");

      const response = await updateCliente(clienteId, payload);

      if (response && response.error) {
        throw new Error("Erro ao atualizar cliente.");
      }
      const queryParams = new URLSearchParams();

      queryParams.set("type", "success");
      queryParams.set("message", "Cliente atualizado com sucesso!");

      router.push(`/painel/clientes?${queryParams.toString()}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  //Função de buscar endereco com o CEP
  const handleCEPChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleCEPChange(e, form);
  };
  const fetchConvenios = async () => {
    try {
      const { data } = await getConvenios();
      setConvenios(data);
    } catch (error) {
      console.error("Error ao buscar convênios:", error);
    }
  };

  // Inicializar descontos quando convênios são carregados
  useEffect(() => {
    if (convenios.length > 0 && !cliente) {
      const initialDescontos: Record<string, number> = {};
      convenios.forEach((convenio) => {
        initialDescontos[convenio.id] = convenio.desconto;
      });
      form.setValue("desconto", initialDescontos);
    }
  }, [convenios, form, cliente]);

  useEffect(() => {
    setCarregando(true);
    async function fetchData() {
      try {
        await fetchConvenios();
        if (!clienteId) redirect("painel/clientes");
        const data = await getClienteById(+clienteId);
        setCliente(data);
        if (data.Convenio) {
          const conveniosIds = data.Convenio.map((item) => item.conveniosId);
          const descontos = data.Convenio.reduce((acc, item) => {
            acc[item.conveniosId] = item.desconto;
            return acc;
          }, {} as Record<number, number>);

          form.reset({
            nome: data.nome,
            email: data.email,
            dtnascimento: data.dtnascimento,
            sexo: data.sexo,
            cpf: data.cpf,
            cep: data.cep,
            logradouro: data.logradouro,
            numero: data.numero,
            bairro: data.bairro,
            cidade: data.cidade,
            uf: data.uf,
            telefone1: data.telefone1,
            telefone2: data.telefone2,
            convenios: conveniosIds,
            desconto: descontos,
          });
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      } finally {
        setCarregando(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Clientes", href: "/painel/clientes" },
          { label: "Editar Cliente" }, // Último item sem link
        ]}
      />

      {/* Loader - Oculta a Tabela enquanto carrega */}
      {carregando ? (
        <div className="flex justify-center items-center w-full h-40">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Carregando ...</span>
        </div>
      ) : (
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
                          const formattedDate = format(
                            parsedDate,
                            "dd/MM/yyyy"
                          );
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

                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Cliente *</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(Number(value));
                        }}
                        value={String(field.value)}
                      >
                        <FormControl
                          className={
                            form.formState.errors.tipo
                              ? "border-red-500"
                              : "border-gray-300"
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0" disabled>
                            Selecione
                          </SelectItem>

                          {Object.values(TipoCliente).map((item) => {
                            return (
                              <SelectItem key={item} value={String(item)}>
                                {item}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage>
                        {form.formState.errors.tipo?.message}
                      </FormMessage>
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
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="00000-000"
                          maxLength={9}
                          value={field.value || ""}
                          onChange={(e) => {
                            let rawValue = e.target.value.replace(/\D/g, "");
                            const inputEvent = e.nativeEvent as InputEvent;

                            if (
                              inputEvent.inputType === "deleteContentBackward"
                            ) {
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
                          const formattedDate = format(
                            parsedDate,
                            "dd/MM/yyyy"
                          );
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
                type="button"
                variant="outline"
                className="flex items-center gap-2 px-4 py-2 text-sm"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Adicionar Convênios
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl sm:rounded-lg">
                  <DialogHeader>
                    <DialogTitle className="text-lg">
                      Gerenciar Convênios
                    </DialogTitle>
                    <DialogDescription>
                      Selecione os convênios vinculados a este cliente e informe
                      os respectivos descontos.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="max-h-[60vh] overflow-y-auto mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">Selecionar</TableHead>
                          <TableHead>Convênio</TableHead>
                          <TableHead className="w-32">Desconto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {convenios.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name="convenios"
                                render={({ field }) => {
                                  const currentValue = Array.isArray(
                                    field.value
                                  )
                                    ? field.value
                                    : [];

                                  return (
                                    <FormControl>
                                      <Checkbox
                                        className="w-5 h-5"
                                        checked={currentValue.includes(item.id)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            field.onChange([
                                              ...currentValue,
                                              item.id,
                                            ]);
                                          } else {
                                            field.onChange(
                                              currentValue.filter(
                                                (v) => v !== item.id
                                              )
                                            );
                                          }
                                        }}
                                      />
                                    </FormControl>
                                  );
                                }}
                              />
                            </TableCell>
                            <TableCell>{item.nome}</TableCell>
                            <TableCell>
                              <FormField
                                control={form.control}
                                name={`desconto.${item.id}`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="0%"
                                        value={
                                          field.value !== undefined &&
                                          field.value !== null &&
                                          !isNaN(field.value)
                                            ? `${field.value}%`
                                            : `${item.desconto}%`
                                        }
                                        onChange={(e) => {
                                          const raw = e.target.value.replace(
                                            /[^\d]/g,
                                            ""
                                          );
                                          let value = Number(raw);
                                          if (isNaN(value)) value = 0;
                                          if (value > 100) value = 100;
                                          if (value < 0) value = 0;
                                          field.onChange(value);
                                        }}
                                        onBlur={() => {
                                          // Se o campo ficou vazio, usar o desconto padrão do convênio
                                          if (field.value === undefined || field.value === null || isNaN(field.value)) {
                                            field.onChange(item.desconto);
                                          }
                                        }}
                                        className={`text-right ${
                                          form.formState.errors.desconto?.[
                                            item.id
                                          ]
                                            ? "border-red-500"
                                            : ""
                                        }`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <DialogFooter className="mt-6">
                    <Button
                      variant="ghost"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={loadingInativar}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={loadingInativar}
                    >
                      Confirmar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
