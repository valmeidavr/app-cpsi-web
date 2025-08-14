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

type CreateLancamentoFormData = z.infer<typeof createLancamentoSchema>;

export default function NovoLancamento() {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [caixas, setCaixas] = useState<Caixa[]>([]);
  const [planoConta, setPlanoConta] = useState<PlanoConta[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tipo = (
    ["ENTRADA", "SAIDA", "ESTORNO", "TRANSFERENCIA"].includes(
      searchParams.get("tipo") || ""
    )
      ? searchParams.get("tipo")
      : undefined
  ) as "ENTRADA" | "SAIDA" | "ESTORNO" | "TRANSFERENCIA" | undefined;

  const form = useForm<CreateLancamentoFormData>({
    resolver: zodResolver(createLancamentoSchema),
    mode: "onChange",
    defaultValues: {
      valor: "" as unknown as number,
      descricao: "",
      data_lancamento: "",
      tipo: tipo,
      cliente_id: undefined,
      plano_conta_id: 0,
      caixa_id: 0,
      lancamento_original_id: undefined,
      id_transferencia: undefined,
      motivo_estorno: undefined,
      motivo_transferencia: undefined,
      forma_pagamento: "DINHEIRO",
      status_pagamento: "PENDENTE",
      agenda_id: undefined,
      usuario_id: "",
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

  const fetchClientes = async () => {
    try {
      const response = await fetch("/api/clientes?limit=1000");
      const data = await response.json();
      
      console.log('🔍 Debug - Resposta da API clientes:', response.status, data);
      
      if (response.ok) {
        setClientes(data.data);
        console.log('🔍 Debug - Clientes carregados:', data.data);
      } else {
        console.error("Erro ao carregar clientes:", data.error);
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    }
  };

      const fetchUsuario = async () => {
      try {
        const response = await fetch("/api/usuarios?limit=1000");
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
        await fetchClientes();
        await fetchUsuario();
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoadingData(false);
      }
    }
    fetchData();
  }, []);

  const onSubmit = async (values: CreateLancamentoFormData) => {
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
      
      {/* Botão de teste para debug */}
      <div className="mb-4 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Debug - Testar APIs:</h3>
        <div className="flex gap-2 flex-wrap">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => fetchClientes()}
            disabled={loadingData}
          >
            Testar Clientes
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => fetchUsuario()}
            disabled={loadingData}
          >
            Testar Usuários
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => fetchCaixas()}
            disabled={loadingData}
          >
            Testar Caixas
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => fetchPlanoContas()}
            disabled={loadingData}
          >
            Testar Plano Contas
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={async () => {
              try {
                const response = await fetch("/api/lancamentos/test");
                const data = await response.json();
                console.log('🔍 Teste - Estrutura das tabelas:', data);
                toast.success('Estrutura verificada. Veja o console.');
              } catch (error) {
                console.error('Erro no teste:', error);
                toast.error('Erro ao testar estrutura');
              }
            }}
            disabled={loadingData}
          >
            Testar Estrutura
          </Button>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          <p>Clientes: {clientes.length} | Usuários: {usuarios.length} | Caixas: {caixas.length} | Plano Contas: {planoConta.length}</p>
        </div>
      </div>
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
                <Select onValueChange={field.onChange} value={field.value || ""} disabled={loading}>
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
            name="cliente_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cliente</FormLabel>
                <Select onValueChange={field.onChange} value={field.value?.toString() || ""} disabled={loading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingData ? "Carregando..." : "Selecione o cliente"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clientes.length === 0 && !loadingData ? (
                      <SelectItem value="" disabled>Nenhum cliente encontrado</SelectItem>
                    ) : (
                      clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id?.toString() || ""}>
                          {cliente.nome} - {cliente.cpf}
                        </SelectItem>
                      ))
                    )}
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
                <Select onValueChange={field.onChange} value={field.value?.toString() || ""} disabled={loading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingData ? "Carregando..." : "Selecione o plano de conta"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {planoConta.length === 0 && !loadingData ? (
                      <SelectItem value="" disabled>Nenhum plano de conta encontrado</SelectItem>
                    ) : (
                      planoConta.map((conta) => (
                        <SelectItem key={conta.id} value={conta.id?.toString() || ""}>
                          {conta.nome}
                        </SelectItem>
                      ))
                    )}
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
                <Select onValueChange={field.onChange} value={field.value?.toString() || ""} disabled={loading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingData ? "Carregando..." : "Selecione o caixa"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {caixas.length === 0 && !loadingData ? (
                      <SelectItem value="" disabled>Nenhum caixa encontrado</SelectItem>
                    ) : (
                      caixas.map((caixa) => (
                        <SelectItem key={caixa.id} value={caixa.id?.toString() || ""}>
                          {caixa.nome}
                        </SelectItem>
                      ))
                    )}
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
                <Select onValueChange={field.onChange} value={field.value?.toString() || ""} disabled={loading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingData ? "Carregando..." : "Selecione o usuário"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {usuarios.length === 0 && !loadingData ? (
                      <SelectItem value="" disabled>Nenhum usuário encontrado</SelectItem>
                    ) : (
                      usuarios.map((usuario) => (
                        <SelectItem key={usuario.login} value={usuario.login || ""}>
                          {usuario.nome}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="flex items-center gap-2" disabled={loading || loadingData}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Lançamento
          </Button>
        </form>
      </Form>
    </div>
  );
}