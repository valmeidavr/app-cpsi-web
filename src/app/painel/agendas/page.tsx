"use client";

//React
import { useEffect, useMemo, useState } from "react";
import ReactPaginate from "react-paginate";
import { FormProvider, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
//Zod

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
//Components
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
//API

//Helpers
import { http } from "@/util/http";
import { addDays, format, formatDate, isSameMinute, parseISO } from "date-fns";

//Types
import { Agenda } from "@/app/types/Agenda";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getUnidades } from "@/app/api/unidades/action";
import { getPrestadors } from "@/app/api/prestadores/action";
import { getEspecialidades } from "@/app/api/especialidades/action";
import { Prestador } from "@/app/types/Prestador";
import { Unidade } from "@/app/types/Unidades";
import { Especialidade } from "@/app/types/Especialidade";
import { createAgendaSchema } from "@/app/api/agendas/schema/formSchemaAgendas";
import { generateDayTimeList } from "./_helpers/hours";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import TabelaAgenda from "./_components/tabela_agenda";

export default function Agendas() {
  const [agendamentosAPI, setAgendamentosAPI] = useState<Agenda[]>([]);
  const [agendamentosGeral, setAgendamentosGeral] = useState<Agenda[]>([]);
  const [horariosDia, setHorariosDia] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [carregandoDadosAgenda, setCarregandoDadosAgenda] = useState(false);
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [unidade, setUnidade] = useState<Unidade | null>(null);
  const [prestador, setPrestador] = useState<Prestador | null>(null);
  const [especialidade, setEspecialidade] = useState<Especialidade | null>(
    null
  );
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [hour, setHour] = useState<string | undefined>();

  //Buscando dados estrangerios
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregando(true);

        await Promise.all([
          // fetchClientes(),
          fetchEspecialidades(),
          fetchPrestadores(),
          fetchUnidades(),
          // fetchExpedientes(),
          // fetchProcedimentos(),
          // fetchConvenios(),
        ]);

        const params = new URLSearchParams(window.location.search);
        const message = params.get("message");
        const type = params.get("type");

        if (message && type == "success") {
          toast.success(message);
        } else if (type == "error") {
          toast.error(message);
        }
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, []);
  //=====================================//
  //Pegando todos os agendamentos quando os campos unidade, Prestador e Especialidade estivem preenchidos
  useEffect(() => {
    if (unidade && prestador && especialidade) {
      carregarAgendamentos();
    }
  }, [date, unidade, prestador, especialidade]);
  //=====================================//
  //Pegando somentos os Agendamentos geral, se existir data,pegar os agendamentos da selecionada
  const carregarAgendamentos = async () => {
    setCarregandoDadosAgenda(true);
    try {
      if (!unidade || !prestador || !especialidade) return;
      //Agendamentos Geral, para o component de caledario identificar os status do dia, buscando apenas referentes ao unidade, prestador e especialidade selecionado
      const { data: response } = await http.get(
        "http://localhost:3000/agendas",
        {
          params: {
            unidadesId: unidade.id,
            prestadoresId: prestador.id,
            especialidadesId: especialidade.id,
          },
        }
      );
      setAgendamentosGeral(response.data);

      if (!date) return;
      //Agedanementos da data selecionada, para trazer os horarios
      console.log("Data", format(date, "yyyy-MM-dd"));
      const { data } = await http.get("http://localhost:3000/agendas", {
        params: {
          date: format(date, "yyyy-MM-dd"),
          unidadesId: unidade.id,
          prestadoresId: prestador.id,
          especialidadesId: especialidade.id,
        },
      });

      const agendamentos = data.data;
      setAgendamentosAPI(agendamentos);
      console.log("Agendamento", agendamentos);
      const novaLista = timeList.map((time) => {
        const agendaDoHorario = agendamentos.find((agenda: Agenda) => {
          const iso =
            typeof agenda.dtagenda === "string"
              ? agenda.dtagenda
              : new Date(agenda.dtagenda).toISOString();

          const agendaTime = iso.slice(11, 16);
          return agendaTime == time;
        });

        if (agendaDoHorario) {
          return {
            hora: time,
            situacao: agendaDoHorario.situacao,
            paciente: agendaDoHorario.clientes?.nome || null,
            tipo: agendaDoHorario.procedimentosId || null,
            dadosAgendamento: agendaDoHorario,
          };
        } else {
          return {
            hora: time,
            situacao: "LIVRE",
            paciente: null,
            tipo: null,
            dadosAgendamento: null,
          };
        }
      });
      setHorariosDia(novaLista);
    } catch (error) {
      console.error("Erro ao buscar agendas:", error);
    } finally {
      setCarregandoDadosAgenda(false);
    }
  };

  //Validação dos campos do formulário
  const form = useForm({
    resolver: zodResolver(createAgendaSchema),
    mode: "onChange",
    defaultValues: {
      prestadoresId: 0,
      unidadesId: 0,
      especialidadesId: 0,
    },
  });

  //Função de selecionar data quando clicar no caledário
  const handleDateClick = (date: Date | undefined) => {
    setDate(date);
    setHour(undefined);
  };

  //Gerar lista de horas
  const timeList = useMemo(() => {
    if (!date) {
      return [];
    }

    return generateDayTimeList(date).filter(async (time) => {
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

      const agenda = await agendamentosAPI.find((agenda) => {
        const agendaDate = new Date(agenda.dtagenda);
        // Compara se é o mesmo minuto
        return isSameMinute(currentDate, agendaDate);
      });

      if (!agenda) {
        return true;
      }

      return false;
    });
  }, [date, agendamentosAPI]);

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
  return (
    <div className="container mx-auto">
      <div>
        <FormProvider {...form}>
          <div className="grid grid-cols-3 space-x-3">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="unidadesId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(Number(value));
                        setUnidade(
                          unidades.find((unidade) => unidade.id == +value) ??
                            null
                        );
                      }}
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
                      disabled={!unidade}
                      onValueChange={(value) => {
                        field.onChange(Number(value));
                        setEspecialidade(
                          especialidades.find(
                            (especialidade) => especialidade.id == +value
                          ) ?? null
                        );
                      }}
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
              <FormField
                control={form.control}
                name="prestadoresId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prestadores *</FormLabel>
                    <Select
                      disabled={!especialidade}
                      onValueChange={(value) => {
                        field.onChange(Number(value));
                        setPrestador(
                          prestadores.find(
                            (prestador) => prestador.id == +value
                          ) ?? null
                        );
                      }}
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
                name="dtagenda"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleDateClick}
                      locale={ptBR}
                      modifiers={agendamentosGeral.reduce((acc, agenda) => {
                        const { dtagenda, situacao } = agenda;
                        const date = new Date(dtagenda);
                        if (!acc[situacao]) acc[situacao] = [];
                        acc[situacao].push(date);
                        return acc;
                      }, {} as Record<string, Date[]>)}
                      modifiersClassNames={{
                        AGENDADO: "bg-white-1000 text-green-700 font-semibold",
                        FINALIZADO: "bg-red-100 text-red-700",
                        CONFIRMADO: "bg-yellow-100 text-yellow-700",
                        BLOQUEADO: "bg-red-300 text-red-900",
                      }}
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
            </div>
            <div className="col-span-2 ">
              <TabelaAgenda
                carregandoDadosAgenda={carregandoDadosAgenda}
                date={date}
                horariosDia={horariosDia}
                prestador={prestador!}
                unidade={unidade!}
                especialidade={especialidade!}
                carregarAgendamentos={carregarAgendamentos}
              />
            </div>
          </div>
        </FormProvider>
      </div>
    </div>
  );
}
