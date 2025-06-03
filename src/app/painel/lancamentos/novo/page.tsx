"use client";

//React
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";

//Zod
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

//Components
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

//API
import { getUsuarios } from "@/app/api/usuarios/action";
import { createLancamentoSchema } from "@/app/api/lancamentos/schema/formSchemeLancamentos";
import { createLancamento } from "@/app/api/lancamentos/action";

//helpers
import { http } from "@/util/http";
//Types
import { PlanoConta } from "@/app/types/PlanoConta";
import { Usuario } from "@/app/types/Usuario";
import { Caixa } from "@/app/types/Caixa";

export default function NovoLancamento() {
  const [loading, setLoading] = useState(false);
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [planoConta, setPlanoConta] = useState<PlanoConta[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
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
      const { data } = await http.get("https://api-cpsi.aapvr.com.br//caixas");
      setCaixas(data.data);
    } catch (error: any) {}
  };
  const fetchPlanoContas = async () => {
    try {
      const { data } = await http.get("https://api-cpsi.aapvr.com.br//plano-contas");
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
  const onSubmit = async (values: z.infer<typeof createLancamentoSchema>) => {
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

          <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
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
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ENTRADA">ENTRADA</SelectItem>
                      <SelectItem value="SAIDA">SAÍDA</SelectItem>
                      <SelectItem value="TRANSFERENCIA">
                        TRANSFERÊNCIA
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-500 text-sm mt-1" />
                </FormItem>
              )}
          />

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
                    value={field.value ? String(field.value) : ""}
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
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0" disabled>
                        Selecione
                      </SelectItem>
                      {usuarios.map((usuario) => (
                        <SelectItem
                          key={usuario.id}
                          value={usuario.id.toString()}
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
            <FormField
              control={form.control}
              name="caixas_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Caixa *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ? String(field.value) : ""}
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
          </div>

          <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                  <textarea
                      {...field}
                      rows={4} // Você pode ajustar o número de linhas conforme necessário
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
    </div>
  );
}
