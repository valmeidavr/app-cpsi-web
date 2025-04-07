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
import {  useRouter, useSearchParams } from "next/navigation";

import { formSchema } from "@/app/api/lancamentos/schema/formSchemeLancamentos";
import { createLancamento } from "@/app/api/lancamentos/action";
import { http } from "@/util/http";
import { EspecialidadeDTO } from "@/app/types/Especialidade";
import { getUsuarios } from "@/app/api/usuarios/action";


export default function NovoLancamento() {
  const [loading, setLoading] = useState(false);
  const [caixas, setCaixas] = useState<EspecialidadeDTO[]>([]);
  const [planoConta, setPlanoConta] = useState<EspecialidadeDTO[]>([]);
  const [usuarios, setUsuarios] = useState<EspecialidadeDTO[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tipo = (
    ["ENTRADA", "SAIDA", "ESTORNO", "TRANSFERENCIA"].includes(
      searchParams.get("tipo") || ""
    )
      ? searchParams.get("tipo")
      : undefined
  ) as "ENTRADA" | "SAIDA" | "ESTORNO" | "TRANSFERENCIA" | undefined;
  const form = useForm({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      valor: 0,
      descricao: "",
      data_lancamento: "",
      tipo: tipo,
      clientes_Id: undefined,
      plano_contas_id: 0,
      caixas_id: 0,
      lancamentos_original_id: null,
      id_transferencia: null,
      motivo_estorno: null,
      motivo_transferencia: null,
      forma_pagamento: undefined,
      status_pagamento: undefined,
      agendas_id: null,
      usuario_id: 0,
    },
  });

  const fetchCaixas = async () => {
    try {
      const { data } = await http.get("http://localhost:3000/caixas");
      setCaixas(data.data);
    } catch (error: any) {}
  };
  const fetchPlanoContas = async () => {
    try {
      const { data } = await http.get("http://localhost:3000/plano-contas");
      setPlanoConta(data.data);
    } catch (error: any) {}
  };
  const fetchUsuario = async () => {
    try {
      const { data } = await getUsuarios();
      setUsuarios(data);
    } catch (error: any) {}
  };

  useEffect(() => {
    fetchCaixas();
    fetchPlanoContas();
    fetchUsuario();
  }, []);
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      await createLancamento(values);
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
          { label: "Lancamentos", href: "/painel/lancamentos" },
          { label: "Novo Lancamento" }, // Último item sem link
        ]}
      />
      <Form {...form}>
        <h1 className="text-2xl font-bold mb-4 mt-5">Novo Lançamento</h1>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex-1 overflow-y-auto space-y-4 p-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="valor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$) *</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      value={field.value || ""}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, "");
                        value = "R$" + (Number(value) / 100).toFixed(2) + "";
                        field.onChange(value.replace(".", ","));
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
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      className={
                        form.formState.errors.descricao
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
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PIX">Pix</SelectItem>
                      <SelectItem value="BOLETO">BOLETO</SelectItem>
                      <SelectItem value="CHEQUE">CHEQUE</SelectItem>
                      <SelectItem value="CARTAO">CARTAO</SelectItem>
                      <SelectItem value="DINHEIRO">DINHEIRO</SelectItem>
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
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PENDENTE">PENDENTE</SelectItem>
                      <SelectItem value="PAGO">PAGO</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500 text-sm mt-1" />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              name="plano_contas_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plano de Conta *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value.toString() || ""}
                  >
                    <FormControl
                      className={
                        form.formState.errors.plano_contas_id
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
              name="usuario_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usuário *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value.toString() || ""}
                  >
                    <FormControl
                      className={
                        form.formState.errors.usuario_id
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
                      {usuarios.map((cliente) => (
                        <SelectItem
                          key={cliente.id}
                          value={cliente.id.toString()}
                        >
                          {cliente.nome}
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
              name="caixas_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Caixa *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value.toString() || ""}
                  >
                    <FormControl
                      className={
                        form.formState.errors.caixas_id
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
