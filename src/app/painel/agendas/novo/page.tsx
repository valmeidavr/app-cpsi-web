"use client";

//React
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

//Zod
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

//Components
import { Button } from "@/components/ui/button";
import { Save, Loader2, CalendarIcon } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
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
import { ptBR } from "date-fns/locale";
import { addDays, format, isSameMinute, setHours, setMinutes } from "date-fns";
import { createAgendaSchema } from "@/app/api/agendas/schema/formSchemaAgendas";
import { createAgenda, getAgendas } from "@/app/api/agendas/action";
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
import { getExpedientes } from "@/app/api/expediente/action";
import { getPrestadors } from "@/app/api/prestadores/action";
import { getUnidades } from "@/app/api/unidades/action";
import { getEspecialidades } from "@/app/api/especialidades/action";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { generateDayTimeList } from "../_helpers/hours";
import { Agenda } from "@/app/types/Agenda";

export default function NovoAgenda() {
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [hour, setHour] = useState<string | undefined>();
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const router = useRouter();

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
  const handleDateClick = (date: Date | undefined) => {
    setDate(date);
    setHour(undefined);
  };

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
  const handleHourClick = (time: string) => {
    setHour(time);
  };

  const timeList = useMemo(() => {
    if (!date) {
      return [];
    }

    return generateDayTimeList(date).filter((time) => {
      const timeHour = Number(time.split(":")[0]);
      const timeMinutes = Number(time.split(":")[1]);
      //Arrumando o fuso horario
      const currentDate = new Date(
        Date.UTC(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          timeHour,
          timeMinutes,
          0,
          0
        )
      );

      const agenda = agendas.find((agenda) => {
        const agendaDate = new Date(agenda.dtagenda);
        console.log("agendaDate:", agendaDate);
        // Compara se é o mesmo minuto
        return isSameMinute(currentDate, agendaDate);
      });

      if (!agenda) {
        return true;
      }

      return false;
    });
  }, [date, agendas]);

  useEffect(() => {
    if (!date) {
      return;
    }

    const refreshAvailableHours = async () => {
      const agendamento = await getAgendas(1, 1, undefined, date);
      console.log("Agendamentos", agendamento.data);
      setAgendas(agendamento.data);
    };

    refreshAvailableHours();
  }, [date]);

  useEffect(() => {
    const carregarDados = async () => {
      try {
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
      await createAgenda(values);
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
          { label: "Agendar" },
        ]}
      />
      {carregando ? (
        <div className="flex justify-center items-center w-full h-40">
          <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Carregando ...</span>
        </div>
      ) : (
        <Form {...form}>
          <h1 className="text-2xl font-bold mb-4 mt-5">Novo Agendamento</h1>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex-1 overflow-y-auto space-y-4 p-2"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="dtagenda"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleDateClick}
                      locale={ptBR}
                      fromDate={addDays(new Date(), 1)}
                      styles={{
                        root: { width: "100%" }, // shadcn usa isso internamente
                        month: { width: "100%" },
                        table: { width: "100%" },
                        head_cell: {
                          width: "100%",
                          textTransform: "capitalize",
                        },
                        cell: {
                          width: "100%",
                        },
                        button: {
                          width: "100%",
                        },
                        nav_button_previous: {
                          width: "32px",
                          height: "32px",
                        },
                        nav_button_next: {
                          width: "32px",
                          height: "32px",
                        },
                        caption: {
                          textTransform: "capitalize",
                        },
                      }}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {date && (
                <div className="flex gap-3 mt-3 py-6 px-5 flex-wrap">
                  {timeList.map((time) => (
                    <Button
                      onClick={() => handleHourClick(time)}
                      variant={hour === time ? "default" : "outline"}
                      className="rounded-full"
                      key={time}
                      type="button"
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              )}
              {/* <FormField
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
              /> */}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
