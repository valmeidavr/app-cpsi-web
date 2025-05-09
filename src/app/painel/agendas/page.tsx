"use client";

//React
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";

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

//Types
import { Agenda } from "@/app/types/Agenda";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAgendaSchema } from "@/app/api/agendas/schema/formSchemaAgendas";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import TabelaAgenda from "./_components/tabelaAgenda";
import { Loader2 } from "lucide-react";
import { useAgenda } from "./AgendaContext";

export default function Agendas() {
  const {
    prestador,
    setPrestador,
    unidade,
    setUnidade,
    especialidade,
    setEspecialidade,
    date,
    setDate,
    carregarAgendamentosGeral,
    carregandoDadosAgenda,
    loading,
    setLoading,
    agendamentosGeral,
    prestadores,
    especialidades,
    unidades,
  } = useAgenda();

  useEffect(() => {
    if (unidade && prestador && especialidade) {
      carregarAgendamentosGeral(); // carrega todos para o calendário
    }
  }, [unidade, prestador, especialidade]);

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
  };

  const normalizarData = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());

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
                            const data = normalizarData(
                              new Date(agenda.dtagenda)
                            );
                            const chave = data.getTime().toString(); // chave numérica (timestamp)

                            if (!agendamentosPorDia.has(chave)) {
                              agendamentosPorDia.set(chave, []);
                            }

                            agendamentosPorDia.get(chave)!.push(agenda);
                          });

                          const diasVerde: Date[] = [];
                          const diasVermelho: Date[] = [];

                          agendamentosPorDia.forEach((agendas, chave) => {
                            const data = new Date(Number(chave));
                            const temLivre = agendas.some(
                              (a) => a.situacao === "LIVRE"
                            );

                            if (temLivre) {
                              diasVerde.push(data);
                            } else {
                              diasVermelho.push(data);
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
              <TabelaAgenda />
            </div>
          </div>
        </FormProvider>
      </div>
    </div>
  );
}
