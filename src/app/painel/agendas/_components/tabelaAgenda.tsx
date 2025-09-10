"use client";
import {
  createAgendaSchema,
  updateAgendaSchema,
} from "@/app/api/agendas/schema/formSchemaAgendas";
import { Especialidade } from "@/app/types/Especialidade";
import { Prestador } from "@/app/types/Prestador";
import { Unidade } from "@/app/types/Unidades";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2, MenuIcon, PencilIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { statusItems } from "../_helpers/statusItem";
import { useAgenda } from "../AgendaContext";
import ModalAgendamento from "./modalAgendamento";
import CriarAgendamento from "./criarAgendamento";
import { Badge } from "@/components/ui/badge";
import { localDateToUTCISO } from "@/app/helpers/dateUtils";
import { Agenda } from "@/app/types/Agenda";
const TabelaAgenda = () => {
  const {
    prestador,
    unidade,
    especialidade,
    date,
    horariosDia,
    carregarAgendamentos,
    carregandoDadosAgenda,
  } = useAgenda();
  const [modalAgendamentoOpen, setModalAgendamentoOpen] =
    useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [horaSelecionada, setHoraSelecionada] = useState<string | null>(null);
  const [dataSelecionada, setDataSelecionada] = useState<Date | null>(null);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<{
    hora: string;
    situacao: string;
    paciente: string | null;
    tipo: string;
    dadosAgendamento: Agenda;
  } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isOpenModalCreate, setIsOpenModalCreate] = useState<boolean>(false);
  const form = useForm<z.infer<typeof createAgendaSchema>>({
    resolver: zodResolver(createAgendaSchema),
    mode: "onChange",
    defaultValues: {
      situacao: "AGENDADO",
      cliente_id: 0,
      convenio_id: 0,
      procedimento_id: 0,
      prestador_id: prestador?.id ?? 0,
      unidade_id: unidade?.id ?? 0,
      especialidade_id: especialidade?.id ?? 0,
      dtagenda: "",
      tipo: "PROCEDIMENTO",
      tipo_cliente: "NSOCIO",
    },
  });
  const abrirModalAgendamento = async (hora: string, data: Date) => {
    setHoraSelecionada(hora);
    setDataSelecionada(data);
    
    try {
      // Se há um agendamento selecionado, estamos EDITANDO
      if (agendamentoSelecionado) {
        console.log('✏️ [TABELA] Modo EDIÇÃO - carregando dados do agendamento:', agendamentoSelecionado.dadosAgendamento.id);
        const response = await fetch(`/api/agendas/${agendamentoSelecionado.dadosAgendamento.id}`);
        if (!response.ok) {
          throw new Error("Erro ao carregar dados do agendamento");
        }
        const dadosAgendamento = await response.json();
        form.reset({
          convenio_id: dadosAgendamento.convenio_id,
          cliente_id: dadosAgendamento.cliente_id,
          procedimento_id: dadosAgendamento.procedimento_id,
          situacao: "AGENDADO",
          tipo_cliente: dadosAgendamento.tipo_cliente || "NSOCIO",
        });
      } else {
        // Se NÃO há agendamento selecionado, estamos CRIANDO um novo
        console.log('➕ [TABELA] Modo CRIAÇÃO - slot vazio para novo agendamento');
        form.reset({
          convenio_id: 0,
          cliente_id: 0,
          procedimento_id: 0,
          situacao: "AGENDADO",
          tipo_cliente: "NSOCIO",
        });
      }
    } catch (error) {
      console.error('❌ [TABELA] Erro ao preparar modal:', error);
      toast.error("Erro ao carregar dados do agendamento");
    } finally {
      setModalAgendamentoOpen(true);
    }
  };
  useEffect(() => {
    if (modalAgendamentoOpen && horaSelecionada && dataSelecionada) {
      const dtagenda = localDateToUTCISO(dataSelecionada, horaSelecionada);
      form.setValue("dtagenda", dtagenda);
    }
  }, [modalAgendamentoOpen, horaSelecionada, dataSelecionada]);
  useEffect(() => {
    if (prestador) {
      form.setValue("prestador_id", prestador.id);
    }
    if (unidade) {
      form.setValue("unidade_id", unidade.id);
    }
    if (especialidade) {
      form.setValue("especialidade_id", especialidade.id);
    }
  }, [prestador, unidade, especialidade]);
  const excluirAgendamento = async (agendaId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/agendas/${agendaId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ situacao: "INATIVO" }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro ao cancelar agendamento: ${response.status} - ${errorData.error || 'Erro desconhecido'}`);
      }
      toast.success(
        `Agendamento do dia ${
          dataSelecionada && format(dataSelecionada, "dd/MM/yyyy")
        } às ${horaSelecionada} foi cancelado com sucesso!`
      );
      await carregarAgendamentos();
    } catch (error) {
      toast.error(`Não foi possível cancelar o agendamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
    }
  };
  const handleStatusAgenda = async (agendaId: number, situacao: string) => {
    try {
      const response = await fetch(`/api/agendas/${agendaId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ situacao }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro ao alterar situação: ${response.status} - ${errorData.error || 'Erro desconhecido'}`);
      }
      const result = await response.json();
      toast.success(
        `Situação do agendamento foi alterada para ${situacao} com sucesso!`
      );
      await carregarAgendamentos();
    } catch (error) {
      toast.error(`Erro ao alterar situação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };
  const getStatusClass = (situacao: string) => {
    const item = statusItems.find((i) => i.label === situacao);
    if (!item) return "bg-gray-200 text-gray-800";
    return `${item.color} bg-opacity-10 border border-current px-2 py-1 text-xs rounded-full font-medium`;
  };
  return (
    <>
      {date && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Agendamentos do Dia
          </h3>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-lg font-medium text-blue-600">
              {format(date, "dd/MM/yyyy")}
            </span>
          </div>
        </div>
      )}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <TableRow className="hover:bg-gray-50">
              <TableHead className="text-center font-semibold text-gray-700 py-4">Horário</TableHead>
              <TableHead className="text-center font-semibold text-gray-700 py-4">Paciente</TableHead>
              <TableHead className="text-center font-semibold text-gray-700 py-4">Tipo</TableHead>
              <TableHead className="text-center font-semibold text-gray-700 py-4">Situação</TableHead>
              <TableHead className="text-center font-semibold text-gray-700 py-4">Ações</TableHead>
            </TableRow>
          </TableHeader>
          {carregandoDadosAgenda ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="py-12">
                  <div className="flex justify-center items-center">
                    <div className="flex items-center space-x-3">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      <span className="text-gray-600 font-medium">Carregando agendamentos...</span>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {date ? (
                horariosDia.length > 0 ? (
                  horariosDia.map((agenda, index) => (
                    <TableRow key={index} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                      <TableCell className="text-center py-4">
                        <span className="font-mono text-sm font-medium text-gray-900">
                          {agenda.hora}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        {agenda.paciente ? (
                          <div className="flex items-center justify-center">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-blue-600 font-semibold text-sm">
                                {agenda.paciente.split(" ")[0][0]}
                                {agenda.paciente.split(" ")[agenda.paciente.split(" ").length - 1]?.[0]}
                              </span>
                            </div>
                            <span className="text-gray-900 font-medium">
                              {(() => {
                                const partes = agenda.paciente.split(" ");
                                return partes.length > 1
                                  ? `${partes[0]} ${partes[partes.length - 1]}`
                                  : partes[0];
                              })()}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-gray-500 text-sm">?</span>
                            </div>
                            <span className="text-gray-400 italic font-medium">
                              Paciente não definido
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {agenda.tipo || "Procedimento"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <Badge className={getStatusClass(agenda.situacao)}>
                          {agenda.situacao}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                              <MenuIcon className="w-4 h-4 text-gray-600" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56" align="end">
                            <DropdownMenuLabel className="text-xs font-medium text-gray-500">
                              Ações do Agendamento
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {agenda.situacao === "LIVRE" ? (
                              <>
                                <DropdownMenuLabel className="text-xs font-medium text-gray-500">
                                  Alterar Situação
                                </DropdownMenuLabel>
                                {statusItems
                                  .filter(item => item.label !== agenda.situacao) // Não mostrar a situação atual
                                  .map(({ label, color, icon }) => (
                                    <DropdownMenuItem
                                      key={label}
                                      className={`flex items-center cursor-pointer ${color}`}
                                      onSelect={() => {
                                        if (label === "AGENDADO") {
                                          setAgendamentoSelecionado(agenda);
                                          abrirModalAgendamento(agenda.hora, date);
                                        } else {
                                          handleStatusAgenda(
                                            agenda.dadosAgendamento.id,
                                            label
                                          );
                                        }
                                      }}
                                    >
                                      {icon}
                                      {label}
                                    </DropdownMenuItem>
                                  ))}
                                {/* Para horários LIVRE, não há opção de editar */}
                              </>
                            ) : (
                              <>
                                <DropdownMenuLabel className="text-xs font-medium text-gray-500 mt-2">
                                  Alterar Situação
                                </DropdownMenuLabel>
                                {statusItems
                                  .filter(item => item.label !== agenda.situacao) // Não mostrar a situação atual
                                  .map(({ label, color, icon }) => (
                                    <DropdownMenuItem
                                      key={label}
                                      className={`flex items-center cursor-pointer ${color}`}
                                      onSelect={() => {
                                        if (label === "AGENDADO") {
                                          setAgendamentoSelecionado(agenda);
                                          abrirModalAgendamento(agenda.hora, date);
                                        } else {
                                          handleStatusAgenda(
                                            agenda.dadosAgendamento.id,
                                            label
                                          );
                                        }
                                      }}
                                    >
                                      {icon}
                                      {label}
                                    </DropdownMenuItem>
                                  ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-xs font-medium text-gray-500">
                                  Outras Ações
                                </DropdownMenuLabel>
                                {/* Editar só aparece para agendamentos AGENDADOS */}
                                {agenda.situacao === "AGENDADO" && (
                                  <DropdownMenuItem
                                    onSelect={() => {
                                      setAgendamentoSelecionado(agenda);
                                      abrirModalAgendamento(agenda.hora, date);
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <PencilIcon className="w-4 h-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onSelect={() => {
                                    setHoraSelecionada(agenda.hora);
                                    setDataSelecionada(date);
                                    setAgendamentoSelecionado(agenda);
                                    setIsDeleteModalOpen(true);
                                  }}
                                  className="text-red-600 flex items-center cursor-pointer"
                                >
                                  <TrashIcon className="w-4 h-4 mr-2" />
                                  Excluir Agendamento
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-16">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum agendamento</h3>
                        <p className="text-gray-500 text-center max-w-sm">
                          Não há agendamentos para esta data. Selecione outra data ou crie um novo agendamento.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione uma data</h3>
                      <p className="text-gray-500 text-center max-w-sm">
                        Escolha uma data no calendário para visualizar os agendamentos do dia.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          )}
        </Table>
      </div>
      {date && (
        <div className="mt-6 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setIsOpenModalCreate(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg transition-colors shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Encaixe
              </Button>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-100 rounded-full border border-green-300"></div>
                <span>Disponível</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-100 rounded-full border border-red-300"></div>
                <span>Ocupado</span>
              </div>
            </div>
          </div>
        )}
      <ModalAgendamento
        open={modalAgendamentoOpen}
        setOpen={setModalAgendamentoOpen}
        agendamentoSelecionado={agendamentoSelecionado ? {
          id: agendamentoSelecionado.dadosAgendamento.id,
          cliente_id: agendamentoSelecionado.dadosAgendamento.cliente_id || 0,
          convenio_id: agendamentoSelecionado.dadosAgendamento.convenio_id || 0,
          procedimento_id: agendamentoSelecionado.dadosAgendamento.procedimento_id || 0,
          dtagenda: agendamentoSelecionado.dadosAgendamento.dtagenda,
          situacao: agendamentoSelecionado.dadosAgendamento.situacao
        } : null}
        setAgendamentoSelecionado={setAgendamentoSelecionado}
        horaSelecionada={horaSelecionada}
        dataSelecionada={dataSelecionada}
      />
      <CriarAgendamento
        isOpenModalCreate={isOpenModalCreate}
        setIsOpenModalCreate={setIsOpenModalCreate}
        dataSelecionada={dataSelecionada}
      />
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Agendamento </DialogTitle>
          </DialogHeader>
          Tem certeza que deseja excluir o agendamento do dia{" "}
          {dataSelecionada && format(dataSelecionada!, "dd/MM/yyyy")} no horário{" "}
          {horaSelecionada}
          <DialogFooter>
            <Button variant="secondary" disabled={loading}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              type="submit"
              disabled={loading}
              onClick={() => {
                if (!agendamentoSelecionado?.dadosAgendamento?.id) {
                  toast.error("Agendamento não selecionado");
                  return;
                }
                excluirAgendamento(agendamentoSelecionado.dadosAgendamento.id);
              }}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
export default TabelaAgenda;