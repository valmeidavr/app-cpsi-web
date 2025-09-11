"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  redirect,
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { createLancamentoSchema } from "@/app/api/lancamentos/schema/formSchemeLancamentos";
import { formatValor, formatValorInput, parseValorInput } from "@/app/helpers/format";
import { Lancamento } from "@/app/types/Lancamento";
import { Caixa } from "@/app/types/Caixa";
import { PlanoConta } from "@/app/types/PlanoConta";
import { Usuario } from "@/app/types/Usuario";
import { Cliente } from "@/app/types/Cliente";
export default function EditarLancamento() {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [lancamento, setLancamento] = useState<Lancamento[]>([]);
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [planoConta, setPlanoConta] = useState<PlanoConta[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [valorFormatado, setValorFormatado] = useState("R$ 0,00");
  const router = useRouter();
  const params = useParams();
  const lancamentoId = Array.isArray(params.id) ? params.id[0] : params.id;
  const searchParams = useSearchParams();
  const tipo = (
    ["ENTRADA", "SAIDA", "ESTORNO", "TRANSFERENCIA"].includes(
      searchParams.get("tipo") || ""
    )
      ? searchParams.get("tipo")
      : undefined
  ) as "ENTRADA" | "SAIDA" | "ESTORNO" | "TRANSFERENCIA" | undefined;
  const form = useForm({
    resolver: zodResolver(createLancamentoSchema),
    mode: "onChange",
    defaultValues: {
      valor: "" as unknown as number,
      descricao: "",
      data_lancamento: "",
      cliente_id: undefined,
      plano_conta_id: 0,
      caixa_id: 0,
      lancamento_original_id: null,
      id_transferencia: null,
      motivo_estorno: null,
      motivo_transferencia: null,
      forma_pagamento: undefined,
      status_pagamento: undefined,
      agenda_id: null,
      usuario_id: undefined,
    },
  });
  const fetchCaixas = async () => {
    try {
      const response = await fetch("/api/caixa");
      const data = await response.json();
      if (response.ok) {
        setCaixas(data.data);
      } else {
      }
    } catch (error) {
    }
  };
  const fetchPlanoContas = async () => {
    try {
      const response = await fetch("/api/plano_contas");
      const data = await response.json();
      if (response.ok) {
        setPlanoConta(data.data);
      } else {
      }
    } catch (error) {
    }
  };
  const fetchUsuario = async () => {
    try {
      const response = await fetch("/api/usuarios");
      const data = await response.json();
      if (response.ok) {
        setUsuarios(data.data);
      } else {
      }
    } catch (error) {
    }
  };
  const fetchClientes = async () => {
    try {
      const response = await fetch("/api/clientes?limit=1000");
      const data = await response.json();
      if (response.ok) {
        setClientes(data.data);
      } else {
      }
    } catch (error) {
    }
  };
  useEffect(() => {
    setLoadingData(true);
    async function fetchData() {
      try {
        if (!lancamentoId) redirect("/painel/lancamentos");
        await fetchCaixas();
        await fetchPlanoContas();
        await fetchUsuario();
        await fetchClientes();
        const response = await fetch(`/api/lancamentos/${lancamentoId}`);
        const data = await response.json();
        if (response.ok) {
          setLancamento(data);
          setValorFormatado(formatValor(data.valor));
          form.reset({
            valor: data.valor,
            descricao: data.descricao,
            data_lancamento: data.data_lancamento ? new Date(data.data_lancamento).toISOString().split('T')[0] : "",
            cliente_id: data.clientes_id,
                    plano_conta_id: data.plano_conta_id,
        caixa_id: data.caixa_id,
        lancamento_original_id: data.lancamento_original_id,
            id_transferencia: data.id_transferencia,
            motivo_estorno: data.motivo_estorno,
            motivo_transferencia: data.motivo_transferencia,
            forma_pagamento: data.forma_pagamento,
            status_pagamento: data.status_pagamento,
            agenda_id: data.agenda_id,
            usuario_id: data.usuario_id,
          });
        } else {
          toast.error("Erro ao carregar dados do lançamento");
        }
      } catch (error) {
      } finally {
        setLoadingData(false);
      }
    }
    fetchData();
  }, []);
  const onSubmit = async (values: z.infer<typeof createLancamentoSchema>) => {
    setLoading(true);
    try {
      if (!lancamentoId) redirect("/painel/lancamentos");
      const response = await fetch(`/api/lancamentos/${lancamentoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || "Erro ao atualizar lançamento.");
      }
      const queryParams = new URLSearchParams();
      queryParams.set("type", "success");
      queryParams.set("message", "Lançamento atualizado com sucesso!");
      router.push(`/painel/lancamentos?${queryParams.toString()}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar lançamento");
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
          { label: "Editar Lançamento" }, // Último item sem link
        ]}
      />
      {loadingData ? (
        <div className="flex justify-center items-center w-full h-40">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Carregando ...</span>
        </div>
      ) : (
        <Form {...form}>
          <h1 className="text-2xl font-bold mb-4 mt-5">Editar Lançamento</h1>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto space-y-4 p-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="plano_conta_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plano de Conta *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
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
                          <SelectItem
                            key={plano.id}
                            value={plano.id.toString()}
                          >
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
                      onValueChange={field.onChange}
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
                          <SelectItem
                            key={caixa.id}
                            value={caixa.id.toString()}
                          >
                            {caixa.nome}
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
                name="usuario_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuário *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ? String(field.value) : ""}
                    >
                      <FormControl
                        className={
                          form.formState.errors.usuario_id
                            ? "border-red-500"
                            : "border-gray-300"
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o usuário" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0" disabled>
                          Selecione
                        </SelectItem>
                        {usuarios.map((usuario) => (
                          <SelectItem
                            key={usuario.login}
                            value={usuario.login.toString()}
                          >
                            {usuario.nome}
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
                      className={`w-full px-3 py-2 rounded-md border ${
                        form.formState.errors.descricao
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
      )}
    </div>
  );
}