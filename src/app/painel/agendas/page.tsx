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
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import TabelaAgenda from "./_components/tabela_agenda";
import { Loader2 } from "lucide-react";

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

      // Buscar agendamentos do dia
      const formattedDate = date ? format(date, "yyyy-MM-dd") : date;

      const { data } = await http.get("http://localhost:3000/agendas", {
        params: {
          date: formattedDate,
          unidadesId: unidade.id,
          prestadoresId: prestador.id,
          especialidadesId: especialidade.id,
        },
      });
      const agendamentos = data.data;
      setAgendamentosAPI(agendamentos);

      const novaLista = agendamentos.map((agenda: Agenda) => {
        const hora = new Date(agenda.dtagenda).toISOString().slice(11, 16);
        return {
          hora,
          situacao: agenda.situacao,
          paciente: agenda.clientes?.nome || null,
          tipo: agenda.procedimentosId || null,
          dadosAgendamento: agenda,
        };
      });

      setHorariosDia(novaLista);
    } catch (error) {
      console.error("Erro ao buscar agendas:", error);
    } finally {
      setCarregandoDadosAgenda(false);
    }
  };

  useEffect(() => {
    if (unidade && prestador && especialidade) {
      carregarAgendamentosGeral(); // carrega todos para o calendário
    }
  }, [unidade, prestador, especialidade]);

  const carregarAgendamentosGeral = async () => {
    try {
      setCarregandoDadosAgenda(true);
      const { data } = await http.get("http://localhost:3000/agendas", {
        params: {
          unidadesId: unidade?.id,
          prestadoresId: prestador?.id,
          especialidadesId: especialidade?.id,
        },
      });
      setAgendamentosGeral(data.data);
    } catch (error) {
      console.error("Erro ao buscar agendamentos gerais:", error);
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
                        field.onChange(value);
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
                        field.onChange(value);
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
              {carregandoDadosAgenda ? (
                <div className="flex justify-center items-center h-20">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                  <span className="ml-2 text-gray-500">Carregando ...</span>
                </div>
              ) : (
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
                        modifiers={(() => {
                          const agendamentosPorDia = new Map<
                            string,
                            Agenda[]
                          >();

                          agendamentosGeral.forEach((agenda) => {
                            const dataStr = new Date(
                              agenda.dtagenda
                            ).toDateString();
                            if (!agendamentosPorDia.has(dataStr)) {
                              agendamentosPorDia.set(dataStr, []);
                            }
                            agendamentosPorDia.get(dataStr)!.push(agenda);
                          });

                          const diasVerde: Date[] = [];
                          const diasVermelho: Date[] = [];

                          agendamentosPorDia.forEach((agendas, dataStr) => {
                            const temLivre = agendas.some(
                              (a) => a.situacao === "LIVRE"
                            );

                            if (temLivre) {
                              diasVerde.push(new Date(dataStr));
                            } else {
                              diasVermelho.push(new Date(dataStr));
                            }
                          });

                          return {
                            verde: diasVerde,
                            vermelho: diasVermelho,
                          };
                        })()}
                        modifiersClassNames={{
                          verde:
                            "bg-green-200 text-green-800 font-semibold ring-2 ring-green-400",
                          vermelho:
                            "bg-red-200 text-red-800 font-semibold ring-2 ring-red-400",
                          selected:
                            "!ring-2 !ring-offset-2 !ring-blue-500 !bg-transparent",
                        }}
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
              )}
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
