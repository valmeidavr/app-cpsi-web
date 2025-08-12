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
import { createLancamentoSchema } from "@/app/api/lancamentos/schema/formSchemeLancamentos";

//Helpers
import { formatValor } from "@/app/helpers/format";

//Types
import { Caixa } from "@/app/types/Caixa";
import { PlanoConta } from "@/app/types/PlanoConta";
import { Usuario } from "@/app/types/Usuario";

export default function NovoLancamento() {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [planoConta, setPlanoConta] = useState<PlanoConta[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
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
    resolver: zodResolver(createLancamentoSchema),
    mode: "onChange",
    defaultValues: {
      valor: "" as unknown as number,
      descricao: "",
      data_lancamento: "",
      tipo: tipo,
      clientes_Id: undefined,
      plano_conta_id: 0,
      caixa_id: 0,
      lancamento_original_id: null,
      id_transferencia: null,
      motivo_estorno: null,
      motivo_transferencia: null,
      forma_pagamento: undefined,
      status_pagamento: undefined,
      agenda_id: null,
      usuario_id: 0,
    },
  });

  const fetchCaixas = async () => {
    try {
      const response = await fetch("/api/caixa");
      const data = await response.json();
      
      if (response.ok) {
        setCaixas(data.data);
      } else {
        console.error("Erro ao carregar caixas:", data.error);
      }
    } catch (error) {
      console.error("Erro ao carregar caixas:", error);
    }
  };

  const fetchPlanoContas = async () => {
    try {
      const response = await fetch("/api/plano_contas");
      const data = await response.json();
      
      if (response.ok) {
        setPlanoConta(data.data);
      } else {
        console.error("Erro ao carregar plano de contas:", data.error);
      }
    } catch (error) {
      console.error("Erro ao carregar plano de contas:", error);
    }
  };

  const fetchUsuario = async () => {
    try {
      const response = await fetch("/api/usuarios");
      const data = await response.json();
      
      if (response.ok) {
        setUsuarios(data.data);
      } else {
        console.error("Erro ao carregar usuários:", data.error);
      }
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    }
  };

  useEffect(() => {
    setLoadingData(true);
    async function fetchData() {
      try {
        await fetchCaixas();
        await fetchPlanoContas();
        await fetchUsuario();
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoadingData(false);
      }
    }
    fetchData();
  }, []);

  const onSubmit = async (values: z.infer<typeof createLancamentoSchema>) => {
    setLoading(true);
    try {
      const response = await fetch("/api/lancamentos", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Erro ao salvar lançamento!");
      }

      const queryParams = new URLSearchParams();
      queryParams.set("type", "success");
      queryParams.set("message", "Lançamento salvo com sucesso!");

      router.push(`/painel/lancamentos?${queryParams.toString()}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Lançamentos", href: "/painel/lancamentos" },
          { label: "Novo Lançamento", href: "/painel/lancamentos/novo" },
        ]}
      />
      <h1 className="text-2xl font-bold mb-4">Novo Lançamento</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="valor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    onBlur={field.onBlur}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
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
                  <Input placeholder="Descrição do lançamento" {...field} disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="data_lancamento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Lançamento</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ENTRADA">Entrada</SelectItem>
                    <SelectItem value="SAIDA">Saída</SelectItem>
                    <SelectItem value="ESTORNO">Estorno</SelectItem>
                    <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="clientes_Id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {usuarios.map((usuario) => (
                      <SelectItem key={usuario.id} value={usuario.id}>
                        {usuario.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
                              name="plano_conta_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plano de Conta</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o plano de conta" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {planoConta.map((conta) => (
                      <SelectItem key={conta.id} value={conta.id}>
                        {conta.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
                              name="caixa_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Caixa</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o caixa" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {caixas.map((caixa) => (
                      <SelectItem key={caixa.id} value={caixa.id}>
                        {caixa.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
                              name="lancamento_original_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lançamento Original</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o lançamento original" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {/* Placeholder for original lancamentos */}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="id_transferencia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transferência</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a transferência" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {/* Placeholder for transferencias */}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="motivo_estorno"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motivo do Estorno</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o motivo do estorno" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {/* Placeholder for motivos de estorno */}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="motivo_transferencia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motivo da Transferência</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o motivo da transferência" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {/* Placeholder for motivos de transferencia */}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="forma_pagamento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Forma de Pagamento</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a forma de pagamento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {/* Placeholder for formas de pagamento */}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status_pagamento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status do Pagamento</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status do pagamento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {/* Placeholder for status de pagamento */}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
                              name="agenda_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agenda</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a agenda" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {/* Placeholder for agendas */}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="usuario_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Usuário</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o usuário" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {usuarios.map((usuario) => (
                      <SelectItem key={usuario.id} value={usuario.id}>
                        {usuario.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="flex items-center gap-2" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Lançamento
          </Button>
        </form>
      </Form>
    </div>
  );
}