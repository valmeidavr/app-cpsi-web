"use client";
import React from "react";
import { parse, isValid } from "date-fns";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { Save, Loader2, Plus } from "lucide-react";
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
import { handleCEPChange } from "@/app/helpers/handleCEP";
import { formatCPFInput, formatTelefoneInput } from "@/app/helpers/format";
import { createClienteSchema } from "@/app/api/clientes/shema/formSchemaCliente";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Convenio } from "@/app/types/Convenios";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Cliente, TipoCliente } from "@/app/types/Cliente";
import { useParams, redirect } from "next/navigation";
import { format } from "date-fns";

const sexOptions = [
  { value: "Masculino", label: "Masculino" },
  { value: "Feminino", label: "Feminino" },
  { value: "outro", label: "Outro" },
];

export default function EditarCliente() {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [loadingInativar, setLoadingInativar] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const params = useParams();
  const clienteId = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();

  useEffect(() => {
    const fetchConvenios = async () => {
      try {
        console.log('🔍 Carregando convênios...');
        const response = await fetch("/api/convenios");
        const data = await response.json();
        console.log('📊 Resposta da API:', data);
        if (data?.data) {
          setConvenios(data.data);
          console.log('✅ Convênios carregados:', data.data);
        } else {
          console.warn('⚠️ Estrutura de resposta inesperada:', data);
          toast.error("Erro ao carregar convênios: estrutura de dados inválida");
        }
      } catch (error) {
        console.error('❌ Erro ao carregar convênios:', error);
        toast.error("Erro ao carregar convênios");
      }
    };
    fetchConvenios();
  }, []);

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
      tipo: undefined,
      telefone1: "",
      telefone2: "",
      dtnascimento: "",
      convenios: [],
      desconto: {},
    },
  });

  useEffect(() => {
    if (convenios.length > 0) {
      const initialDescontos: Record<string, number> = {};
      convenios.forEach((convenio) => {
        initialDescontos[convenio.id] = convenio.desconto;
      });
      form.setValue("desconto", initialDescontos);
    }
  }, [convenios, form]);

  const onSubmit = async (values: z.infer<typeof createClienteSchema>) => {
    setLoading(true);
    
    try {
      const descontosPreenchidos: Record<string, number> = {};
      values.convenios.forEach((convenioId) => {
        const convenio = convenios.find(c => c.id === convenioId);
        if (convenio) {
          const descontoAtual = values.desconto[convenioId];
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
      
      const response = await fetch(`/api/clientes/${clienteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || responseData.details || "Erro ao atualizar cliente.");
      }
      
      const currentUrl = new URL(window.location.href);
      const queryParams = new URLSearchParams(currentUrl.search);
      queryParams.set("type", "success");
      queryParams.set("message", "Cliente atualizado com sucesso!");
      router.push(`/painel/clientes?${queryParams.toString()}`);
    } catch (error: any) {
      console.error('🔴 Erro ao atualizar cliente:', error);
      
      // Verifica se é um erro de validação com detalhes específicos
      if (error.response?.data?.details?.fieldErrors) {
        const fieldErrors = error.response.data.details.fieldErrors;
        const errorMessages: string[] = [];
        
        // Extrai todas as mensagens de erro dos campos
        Object.entries(fieldErrors).forEach(([field, messages]) => {
          if (Array.isArray(messages)) {
            messages.forEach((message: string) => {
              errorMessages.push(`${field}: ${message}`);
            });
          }
        });
        
        if (errorMessages.length > 0) {
          toast.error(`Erro de validação: ${errorMessages.join(', ')}`);
          return;
        }
      }
      
      // Se não é um erro de validação específico, usa a mensagem genérica
      const errorMessage = error.response?.data?.error || 
        error.response?.data?.message || 
        (error instanceof Error ? error.message : "Erro ao atualizar cliente");
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCEPChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleCEPChange(e, {
      setValue: (field: string, value: string) => form.setValue(field as keyof z.infer<typeof createClienteSchema>, value),
      setError: (field: string, error: { type: string; message: string }) => form.setError(field as keyof z.infer<typeof createClienteSchema>, error),
      clearErrors: (field: string) => form.clearErrors(field as keyof z.infer<typeof createClienteSchema>)
    });
  };

  useEffect(() => {
    setCarregando(true);
    async function fetchData() {
      try {
        if (!clienteId) redirect("painel/clientes");
        
        const response = await fetch(`/api/clientes/${clienteId}`);
        const data = await response.json();
        
        if (response.ok) {
          setCliente(data);
          let dataFormatada = "";
          if (data.dtnascimento) {
            try {
              const dataISO = new Date(data.dtnascimento);
              if (!isNaN(dataISO.getTime())) {
                dataFormatada = format(dataISO, "dd/MM/yyyy");
              }
            } catch (error) {
              console.error("Erro ao formatar data:", error);
            }
          }

          const formData = {
            nome: data.nome || "",
            email: data.email || "",
            dtnascimento: dataFormatada,
            sexo: data.sexo || "",
            tipo: data.tipo || data.tipoCliente || TipoCliente.SOCIO,
            cpf: formatCPFInput(data.cpf || ""), // Aplicar formatação do CPF
            cep: data.cep || "",
            logradouro: data.logradouro || "",
            numero: data.numero || "",
            bairro: data.bairro || "",
            cidade: data.cidade || "",
            uf: data.uf || "",
            telefone1: formatTelefoneInput(data.telefone1 || ""), // Aplicar formatação do telefone
            telefone2: formatTelefoneInput(data.telefone2 || data.telefone || ""), // Aplicar formatação do telefone
            convenios: [],
            desconto: {},
          };

          if (data.convenios && Array.isArray(data.convenios)) {
            const conveniosIds = data.convenios.map((item: { convenioId: number }) => item.convenioId);
            const descontos = data.convenios.reduce((acc: Record<number, number>, item: { convenioId: number; desconto: number }) => {
              acc[item.convenioId] = item.desconto;
              return acc;
            }, {} as Record<number, number>);
            formData.convenios = conveniosIds;
            formData.desconto = descontos;
          }

          form.reset(formData);
        } else {
          toast.error("Erro ao carregar dados do cliente");
        }
      } catch (error) {
        toast.error("Erro ao carregar dados do cliente");
      } finally {
        setCarregando(false);
      }
    }
    fetchData();
  }, [clienteId]);

  if (carregando) {
    return (
      <div className="w-full">
        <Breadcrumb
          items={[
            { label: "Painel", href: "/painel" },
            { label: "Clientes", href: "/painel/clientes" },
            { label: "Editar Cliente" },
          ]}
        />
        <div className="flex justify-center items-center w-full h-40">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col">
        <Breadcrumb
          items={[
            { label: "Painel", href: "/painel" },
            { label: "Clientes", href: "/painel/clientes" },
            { label: "Editar Cliente" },
          ]}
        />
        <Form {...form}>
        <h1 className="text-2xl font-bold mb-4 mt-5">Editar Cliente</h1>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 p-2 pb-8"
        >
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Dados Pessoais</h2>
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
                      value={field.value || ""}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        const rawValue = e.target.value.replace(/\D/g, ""); // Remove não numéricos
                        const inputEvent = e.nativeEvent as InputEvent; // Força o tipo correto
                        if (inputEvent.inputType === "deleteContentBackward") {
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
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Endereço</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                          const rawValue = e.target.value.replace(/\D/g, ""); // Remove não numéricos
                          const inputEvent = e.nativeEvent as InputEvent;
                          if (inputEvent.inputType === "deleteContentBackward") {
                            field.onChange(rawValue);
                          } else {
                            field.onChange(
                              rawValue.replace(/^(\d{5})(\d)/, "$1-$2")
                            ); // Aplica a máscara ao digitar
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
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
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Convênios</h2>
            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                className="flex items-center gap-2 px-4 py-2 text-sm"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Gerenciar Convênios
              </Button>
              
              {/* Lista de convênios selecionados */}
              <div className="min-h-[60px]">
                {form.watch("convenios") && form.watch("convenios").length > 0 ? (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Convênios Selecionados:</p>
                    <div className="flex flex-wrap gap-2">
                      {form.watch("convenios").map((convenioId: number) => {
                        const convenio = convenios.find(c => c.id === convenioId);
                        const desconto = form.watch(`desconto.${convenioId}`);
                        return convenio ? (
                          <div key={convenioId} className="bg-blue-50 border border-blue-200 rounded-md px-3 py-1 text-sm">
                            <span className="font-medium">{convenio.nome}</span>
                            <span className="text-gray-600 ml-1">({desconto ?? convenio.desconto}%)</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Nenhum convênio selecionado</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Tipo de Cliente</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Cliente *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl
                      className={
                        form.formState.errors.tipo
                          ? "border-red-500"
                          : "border-gray-300"
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(TipoCliente).map((item) => {
                        return (
                          <SelectItem key={item} value={item}>
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
        
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl sm:rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-lg">
                Gerenciar Convênios
              </DialogTitle>
              <DialogDescription>
                Selecione os convênios vinculados a este cliente e informe os
                respectivos descontos.
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
                                const currentValue = Array.isArray(field.value)
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
                                        if (field.value === undefined || field.value === null || isNaN(field.value)) {
                                          field.onChange(item.desconto);
                                        }
                                      }}
                                      className={`text-right ${
                                        form.formState.errors.desconto?.[item.id]
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
        </form>
        </Form>
        </div>
    </div>
  );
}