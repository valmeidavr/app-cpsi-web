"use client";

//React
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

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
    agendamentosGeral,
    prestadores,
    especialidades,
    unidades,
    currentMonth,
    setCurrentMonth,
  } = useAgenda();

    useEffect(() => {
    if (unidade && prestador && especialidade) {
      carregarAgendamentosGeral();
    }
  }, [unidade, prestador, especialidade, carregarAgendamentosGeral]);

  const form = useForm({
    resolver: zodResolver(createAgendaSchema),
    mode: "onChange",
    defaultValues: {
      prestador_id: 0,
      unidade_id: 0,
      especialidade_id: 0,
    },
  });

  const handleDateClick = (date: Date | undefined) => {
    if (date) {
      setDate(date);
      // Atualizar o mês do calendário para o mês da data selecionada
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  };

  const normalizarData = (d: Date) => {
    const dataNormalizada = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return dataNormalizada;
  };

  const agendamentosPorDia = new Map<string, Agenda[]>();

  agendamentosGeral.forEach((agenda) => {
    const data = normalizarData(new Date(agenda.dtagenda));
    const chave = data.getTime().toString(); 

    if (!agendamentosPorDia.has(chave)) {
      agendamentosPorDia.set(chave, []);
    }

    agendamentosPorDia.get(chave)!.push(agenda);
  });

  const diasVerde: Date[] = [];
  const diasVermelho: Date[] = [];

  agendamentosPorDia.forEach((agendas, chave) => {
    const data = new Date(Number(chave));
    const temLivre = agendas.some((a) => a.situacao === "LIVRE");
    const todosOcupados = agendas.every((a) => a.situacao !== "LIVRE");

    if (temLivre) {
      diasVerde.push(data);
    } else if (todosOcupados && agendas.length > 0) {
      diasVermelho.push(data);
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-12xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Agenda de Consultas</h1>
          <p className="text-gray-600">Gerencie agendamentos e visualize disponibilidade</p>
        </div>

        <FormProvider {...form}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Painel Esquerdo - Filtros e Calendário */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Configurações</h2>
                
                <div className="space-y-6">
                  {/* Filtros */}
                  <div className="space-y-4">
                    {/* Filtros */}
                    <FormField
                      control={form.control}
                      name="unidade_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Unidade *</FormLabel>
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
                            <FormControl>
                              <SelectTrigger className="h-10 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors">
                                <SelectValue placeholder="Selecione uma unidade" />
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="especialidade_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Especialidade *</FormLabel>
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
                            <FormControl>
                              <SelectTrigger className="h-10 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors">
                                <SelectValue placeholder="Selecione uma especialidade" />
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="prestador_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Prestador *</FormLabel>
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
                            <FormControl>
                              <SelectTrigger className="h-10 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors">
                                <SelectValue placeholder="Selecione um prestador" />
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Calendário */}
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">Calendário</h3>
                    
                    {carregandoDadosAgenda ? (
                      <div className="flex justify-center items-center h-32 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                          <span className="text-gray-600">Carregando calendário...</span>
                        </div>
                      </div>
                    ) : (
                      <FormField
                        control={form.control}
                        name="dtagenda"
                        render={({ field }) => (
                          <FormItem>
                            <Calendar
                              mode="single"
                              selected={date}
                              onSelect={handleDateClick}
                              month={currentMonth}
                              onMonthChange={setCurrentMonth}
                              locale={ptBR}
                              modifiers={{
                                verde: diasVerde,
                                vermelho: diasVermelho,
                              }}
                              modifiersClassNames={{
                                verde:
                                  "bg-green-100 text-green-800 font-semibold ring-2 ring-green-300 hover:bg-green-200",
                                vermelho:
                                  "bg-red-100 text-red-800 font-semibold ring-2 ring-red-300 hover:bg-red-200",
                                selected:
                                  "!ring-2 !ring-offset-2 !ring-blue-500 !bg-blue-50 !text-blue-900",
                              }}
                              className="rounded-lg border border-gray-200 bg-white"
                              styles={{
                                root: { width: "100%" },
                                month: { width: "100%" },
                                table: { width: "100%" },
                                head_cell: {
                                  width: "100%",
                                  textTransform: "capitalize",
                                  fontWeight: "600",
                                  color: "#374151",
                                },
                                cell: {
                                  width: "100%",
                                },
                                button: {
                                  width: "100%",
                                  height: "40px",
                                  borderRadius: "8px",
                                  transition: "all 0.2s",
                                },
                                nav_button_previous: {
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "8px",
                                },
                                nav_button_next: {
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "8px",
                                },
                                caption: {
                                  textTransform: "capitalize",
                                  fontWeight: "600",
                                  fontSize: "16px",
                                  color: "#111827",
                                },
                              }}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Painel Direito - Tabela de Agendamentos */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <TabelaAgenda />
              </div>
            </div>
          </div>
        </FormProvider>
      </div>
    </div>
  );
}
