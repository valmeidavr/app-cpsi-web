"use client";

//React
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  redirect,
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";

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
import {
  getLancamentoById,
  updateLancamento,
} from "@/app/api/lancamentos/action";
import { http } from "@/util/http";
import { createLancamentoSchema } from "@/app/api/lancamentos/schema/formSchemeLancamentos";
import { getUsuarios } from "@/app/api/usuarios/action";

//Helpers
import { formatValor } from "@/app/helpers/format";

//Types
import { Lancamento } from "@/app/types/Lancamento";
import { Caixa } from "@/app/types/Caixa";
import { PlanoConta } from "@/app/types/PlanoConta";
import { Usuario } from "@/app/types/Usuario";


export default function EditarLancamento() {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [lancamento, setLancamento] = useState<Lancamento[]>([]);
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [planoConta, setPlanoConta] = useState<PlanoConta[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const router = useRouter();
  const params = useParams();
  const lancamentoId = Array.isArray(params.id) ? params.id[0] : params.id;
  const searchParams = useSearchParams();
  // const lancamentoId = searchParams.get("id") || undefined;
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
    if (!lancamentoId) redirect("/painel/lancamentos");
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoadingData(true);
      await Promise.all([fetchCaixas(), fetchPlanoContas(), fetchUsuario()]);
      const data = await getLancamentoById(lancamentoId as string);
      setLancamento(data);
      console.log(data);
      form.reset({
        valor: formatValor(data.valor) as unknown as number,
        descricao: data.descricao,
        data_lancamento: data.data_lancamento,
        tipo: data.tipo,
        clientes_Id: data.clientes_Id,
        plano_contas_id: data.plano_contas_id,
        caixas_id: data.caixas_id,
        lancamentos_original_id: data.lancamentos_original_id,
        id_transferencia: data.id_transferencia,
        motivo_estorno: data.motivo_estorno,
        motivo_transferencia: data.motivo_transferencia,
        forma_pagamento: data.forma_pagamento,
        status_pagamento: data.status_pagamento,
        agendas_id: data.agendas_id,
        usuario_id: data.usuario_id,
      });
      setLoadingData(false);
    } catch (error) {
      console.error("Erro ao carregar lancamento:", error);
    } finally {
      setLoadingData(false);
    }
  }

  const onSubmit = async (values: z.infer<typeof createLancamentoSchema>) => {
    setLoading(true);
    try {
      console.log("values:", values);
      await updateLancamento(lancamentoId as string, values);
      router.push(
        "/painel/lancamentos?type=success&message=Atualizado com sucesso"
      );
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
          { label: "Lançamentos", href: "/painel/lancamentos" },
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
