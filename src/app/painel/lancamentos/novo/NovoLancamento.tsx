"use client";
import React, { useEffect, useState } from "react";
import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Save, Loader2, Calendar } from "lucide-react";
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
import { createLancamentoSchema } from "@/app/api/lancamentos/schema/formSchemeLancamentos";
import { http } from "@/util/http";
import { PlanoConta } from "@/app/types/PlanoConta";
import { formatValorInput, parseValorInput } from "@/app/helpers/format";
import { Caixa } from "@/app/types/Caixa";
import { Cliente } from "@/app/types/Cliente";
export default function NovoLancamento() {
  const [loading, setLoading] = useState(false);
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [planoConta, setPlanoConta] = useState<PlanoConta[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [valorFormatado, setValorFormatado] = useState("R$ 0,00");
  const router = useRouter();
  const searchParams = useSearchParams();
  const tipo = (
    ["ENTRADA", "SAIDA", "ESTORNO", "TRANSFERENCIA"].includes(
      searchParams.get("tipo")?.toUpperCase() || ""
    )
      ? searchParams.get("tipo")?.toUpperCase()
      : undefined
  ) as keyof typeof TEXTO_POR_TIPO | undefined;
  const TEXTO_POR_TIPO = {
    ENTRADA: "Lançar Entrada",
    SAIDA: "Lançar Saída",
    ESTORNO: "Lançar Estorno",
    TRANSFERENCIA: "Lançar Transferência",
  } as const;
  const toggleText = tipo ? TEXTO_POR_TIPO[tipo] : "";
  const form = useForm({
    resolver: zodResolver(createLancamentoSchema),
    mode: "onChange",
    defaultValues: {
      valor: 0,
      descricao: "",
      data_lancamento: "",
      cliente_id: null,
      plano_conta_id: "0",
      caixa_id: "0",
      lancamento_original_id: null,
      id_transferencia: null,
      motivo_estorno: null,
      motivo_transferencia: null,
      forma_pagamento: "",
      status_pagamento: "",
      agenda_id: null,
      usuario_id: null,
    },
  });
  const fetchCaixas = async () => {
    try {
      const { data } = await http.get("/api/caixa");
      setCaixas(data.data);
    } catch (error) { }
  };
  const fetchPlanoContas = async () => {
    try {
      const { data } = await http.get(
        "/api/plano_contas"
      );
      setPlanoConta(data.data);
    } catch (error) { }
  };
  const fetchClientes = async () => {
    try {
      const { data } = await http.get("/api/clientes?limit=1000");
      setClientes(data.data);
    } catch (error) { }
  };
  useEffect(() => {
    fetchCaixas();
    fetchPlanoContas();
    fetchClientes();
  }, []);
  const onSubmit = async (values: z.infer<typeof createLancamentoSchema>) => {
    setLoading(true);
    try {
      await http.post("/api/lancamentos", values);
      router.push("/painel/lancamentos?type=success&message=salvo com sucesso");
    } catch (error) {
      toast.error("Erro ao salvar lancamento");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col flex-1 h-full">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Lista de Lançamentos", href: "/painel/lancamentos" },
          { label: `${toggleText}` }, // Último item sem link
        ]}
      />
      <Form {...form}>
        <h1 className="text-2xl font-bold mb-4 mt-5">{toggleText}</h1>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto space-y-4 p-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="valor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$) *</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      value={valorFormatado}
                      onChange={(e) => {
                        const formatted = formatValorInput(e.target.value);
                        setValorFormatado(formatted);
                        const numericValue = parseValorInput(formatted);
                        field.onChange(numericValue);
                      }}
                      placeholder="R$ 0,00"
                      className={
                        form.formState.errors.valor
                          ? "border-red-500"
                          : "border-gray-300"
                      }
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm mt-1" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="data_lancamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Lançamento *</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={field.value || ""}
                      onChange={field.onChange}
                      className={
                        form.formState.errors.data_lancamento
                          ? "border-red-500"
                          : "border-gray-300"
                      }
                    />
                  </FormControl>
                  <FormMessage className="text-red-500 text-sm mt-1" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cliente_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "0" ? null : value)}
                    value={field.value ? String(field.value) : "0"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Nenhum cliente</SelectItem>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id.toString()}>
                          {cliente.nome} - {cliente.cpf}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500 text-sm mt-1" />
                </FormItem>
              )}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="plano_conta_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plano de Conta *</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value)}
                    value={field.value ? String(field.value) : ""}
                  >
                    <FormControl
                      className={
                        form.formState.errors.plano_conta_id
                          ? "border-red-500"
                          : "border-gray-300"
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o plano de conta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0" disabled>
                        Selecione
                      </SelectItem>
                      {planoConta.map((plano) => (
                        <SelectItem key={plano.id} value={plano.id.toString()}>
                          {plano.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500 text-sm mt-1" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="caixa_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Caixa *</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value)}
                    value={field.value ? String(field.value) : ""}
                  >
                    <FormControl
                      className={
                        form.formState.errors.caixa_id
                          ? "border-red-500"
                          : "border-gray-300"
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o caixa" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0" disabled>
                        Selecione
                      </SelectItem>
                      {caixas.map((caixa) => (
                        <SelectItem key={caixa.id} value={caixa.id.toString()}>
                          {caixa.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500 text-sm mt-1" />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="forma_pagamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de Pagamento *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl
                      className={
                        form.formState.errors.forma_pagamento
                          ? "border-red-500"
                          : "border-gray-300"
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a forma de pagamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PIX">Pix</SelectItem>
                      <SelectItem value="BOLETO">Boleto</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                      <SelectItem value="CARTAO">Cartão</SelectItem>
                      <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500 text-sm mt-1" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status_pagamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status de Pagamento *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl
                      className={
                        form.formState.errors.status_pagamento
                          ? "border-red-500"
                          : "border-gray-300"
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PENDENTE">Pendente</SelectItem>
                      <SelectItem value="PAGO">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500 text-sm mt-1" />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="descricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <textarea
                    {...field}
                    rows={4}
                    placeholder="Descreva o lançamento..."
                    className={`w-full px-3 py-2 rounded-md border ${form.formState.errors.descricao
                        ? "border-red-500"
                        : "border-gray-300"
                      } focus:ring-2 focus:ring-primary focus:outline-none`}
                  />
                </FormControl>
                <FormMessage />
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