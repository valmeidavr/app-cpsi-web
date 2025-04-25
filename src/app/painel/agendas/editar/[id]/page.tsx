"use client";

//React
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { redirect, useParams, useRouter } from "next/navigation";

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

//Types
import { createAgendaSchema } from "@/app/api/agendas/schema/formSchemaAgendas";
import {
  createAgenda,
  getAgendaById,
  updateAgenda,
} from "@/app/api/agendas/action";
import { getClientes } from "@/app/api/clientes/action";
import { Cliente } from "@/app/types/Cliente";
import { Convenio } from "@/app/types/Convenios";
import { Procedimento } from "@/app/types/Procedimento";
import { Expediente } from "@/app/types/Expediente";
import { Prestador } from "@/app/types/Prestador";
import { Unidade } from "@/app/types/Unidades";
import { Especialidade } from "@/app/types/Especialidade";
import { getConvenios } from "@/app/api/convenios/action";
import { getProcedimentos } from "@/app/api/procedimentos/action";
import { getPrestadors } from "@/app/api/prestadores/action";
import { getUnidades } from "@/app/api/unidades/action";
import { getEspecialidades } from "@/app/api/especialidades/action";
import { Agenda } from "@/app/types/Agenda";
import { formatDate } from "date-fns";
import { getExpedientes } from "@/app/api/expediente/action";

export default function NovoAgenda() {
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [agenda, setAgenda] = useState<Agenda[]>([]);
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();
  const params = useParams();
  const agendaId = Array.isArray(params.id) ? params.id[0] : params.id;
  const form = useForm({
    resolver: zodResolver(createAgendaSchema),
    mode: "onChange",
    defaultValues: {
      dtagenda: "",
      situacao: undefined,
      clientesId: null,
      conveniosId: null,
      procedimentosId: null,
      expedientesId: 0,
      prestadoresId: 0,
      unidadesId: 0,
      especialidadesId: 0,
    },
  });

  const fetchClientes = async () => {
    try {
      const { data } = await getClientes();
      setClientes(data);
    } catch (error: any) {
      toast.error("Erro ao carregar dados dos Clientes");
    }
  };

  const fetchConvenios = async () => {
    try {
      const { data } = await getConvenios();
      setConvenios(data);
    } catch (error: any) {
      toast.error("Erro ao carregar dados dos convenios");
    }
  };
  const fetchProcedimentos = async () => {
    try {
      const { data } = await getProcedimentos();
      setProcedimentos(data);
    } catch (error: any) {
      toast.error("Erro ao carregar dados dos Procedimentos");
    }
  };
  const fetchExpedientes = async () => {
    try {
      const { data } = await getExpedientes();
      console.log("Expedinete", data);
      setExpedientes(data);
    } catch (error: any) {
      toast.error("Erro ao carregar dados dos Expedientes");
    }
  };

  const fetchPrestadores = async () => {
    try {
      const { data } = await getPrestadors();
      setPrestadores(data);
    } catch (error: any) {
      toast.error("Erro ao carregar dados dos Prestadores");
    }
  };
  const fetchUnidades = async () => {
    try {
      const { data } = await getUnidades();
      setUnidades(data);
    } catch (error: any) {
      toast.error("Erro ao carregar dados dos Unidades");
    }
  };
  const fetchEspecialidades = async () => {
    try {
      const { data } = await getEspecialidades();
      setEspecialidades(data);
    } catch (error: any) {
      toast.error("Erro ao carregar dados dos Especialidades");
    }
  };

  useEffect(() => {
    const carregarDados = async () => {
      try {
        if (!agendaId) redirect("/painel/agendas");
        setCarregando(true);

        await Promise.all([
          fetchClientes(),
          fetchEspecialidades(),
          fetchPrestadores(),
          fetchUnidades(),
          fetchExpedientes(),
          fetchProcedimentos(),
          fetchConvenios(),
        ]);

        const data = await getAgendaById(agendaId);
        console.log(data);
        setAgenda(data);

        form.reset({
          dtagenda: formatDate(new Date(data.dtagenda), "yyyy-MM-dd"),
          situacao: data.situacao,
          clientesId: data.clientesId,
          conveniosId: data.conveniosId,
          procedimentosId: data.procedimentosId,
          expedientesId: data.expedientesId,
          prestadoresId: data.prestadoresId,
          unidadesId: data.unidadesId,
          especialidadesId: data.especialidadesId,
        });
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, []);

  const onSubmit = async (values: z.infer<typeof createAgendaSchema>) => {
    setLoading(true);
    console.log(values);
    try {
      if (agendaId) await updateAgenda(agendaId, values);
      router.push("/painel/agendas?type=success&message=Salvo com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar agenda");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full">
      <Breadcrumb
        items={[
          { label: "Painel", href: "/painel" },
          { label: "Agendamentos", href: "/painel/agendas" },
          { label: "Atualizar agendamentos" },
        ]}
      />
      {carregando ? (
        <div className="flex justify-center items-center w-full h-40">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Carregando ...</span>
        </div>
      ) : (
        <Form {...form}>
          <h1 className="text-2xl font-bold mb-4 mt-5">
            Atualizar Agendamento
          </h1>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto space-y-4 p-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="dtagenda"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Início *</FormLabel>
                    <FormControl
                      className={
                        form.formState.errors.situacao
                          ? "border-red-500"
                          : "border-gray-300"
                      }
                    >
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage>
                      {form.formState.errors.dtagenda?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="situacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Situação *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <FormControl
                        className={
                          form.formState.errors.situacao
                            ? "border-red-500"
                            : "border-gray-300"
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="AGENDADO">AGENDADO</SelectItem>
                        <SelectItem value="LIVRE">LIVRE</SelectItem>
                        <SelectItem value="INATIVO">INATIVO</SelectItem>
                        <SelectItem value="CONFIRMADO">CONFIRMADO</SelectItem>
                        <SelectItem value="BLOQUEADO">BLOQUEADO</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-red-500 text-sm mt-1" />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="clientesId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === "0" ? null : Number(value))
                      }
                      value={field.value === null ? "0" : String(field.value)}
                    >
                      <FormControl
                        className={
                          form.formState.errors.situacao
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
                        {clientes.map((cliente) => {
                          return (
                            <SelectItem
                              key={cliente.id}
                              value={String(cliente.id)}
                            >
                              {cliente.nome};
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage>
                      {form.formState.errors.clientesId?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="conveniosId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Convênios</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === "0" ? null : Number(value))
                      }
                      value={field.value === null ? "0" : String(field.value)}
                    >
                      <FormControl
                        className={
                          form.formState.errors.situacao
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
                        {convenios.map((conveios) => {
                          return (
                            <SelectItem
                              key={conveios.id}
                              value={String(conveios.id)}
                            >
                              {conveios.nome};
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage>
                      {form.formState.errors.conveniosId?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="procedimentosId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Procedimentos</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === "0" ? null : Number(value))
                      }
                      value={field.value === null ? "0" : String(field.value)}
                    >
                      <FormControl
                        className={
                          form.formState.errors.situacao
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
                        {procedimentos.map((procedimento) => {
                          return (
                            <SelectItem
                              key={procedimento.id}
                              value={String(procedimento.id)}
                            >
                              {procedimento.nome};
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage>
                      {form.formState.errors.procedimentosId?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expedientesId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expediente *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={String(field.value)}
                    >
                      <FormControl
                        className={
                          form.formState.errors.situacao
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
                        {expedientes.map((expediente) => {
                          return (
                            <SelectItem
                              key={expediente.id}
                              value={String(expediente.id)}
                            >
                              {expediente.id}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage>
                      {form.formState.errors.expedientesId?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="prestadoresId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prestadores *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={String(field.value)}
                    >
                      <FormControl
                        className={
                          form.formState.errors.situacao
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
                        {prestadores.map((prestador) => {
                          return (
                            <SelectItem
                              key={prestador.id}
                              value={String(prestador.id)}
                            >
                              {prestador.nome}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage>
                      {form.formState.errors.prestadoresId?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unidadesId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={String(field.value)}
                    >
                      <FormControl
                        className={
                          form.formState.errors.situacao
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
                        {unidades.map((unidade) => {
                          return (
                            <SelectItem
                              key={unidade.id}
                              value={String(unidade.id)}
                            >
                              {unidade.nome}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage>
                      {form.formState.errors.unidadesId?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="especialidadesId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especialidade *</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      value={String(field.value)}
                    >
                      <FormControl
                        className={
                          form.formState.errors.situacao
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
                        {especialidades.map((especialidade) => {
                          return (
                            <SelectItem
                              key={especialidade.id}
                              value={String(especialidade.id)}
                            >
                              {especialidade.nome}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage>
                      {form.formState.errors.especialidadesId?.message}
                    </FormMessage>
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
