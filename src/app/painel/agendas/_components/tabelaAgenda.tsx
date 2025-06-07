"use client";
import {
  finalizarAgenda,
  getAgendaById,
  updateStatusAgenda,
} from "@/app/api/agendas/action";
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
import { http } from "@/util/http";
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
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<
    any | null
  >(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isOpenModalCreate, setIsOpenModalCreate] = useState<boolean>(false);

  const form = useForm<z.infer<typeof createAgendaSchema>>({
    resolver: zodResolver(createAgendaSchema),
    mode: "onChange",
    defaultValues: {
      situacao: "AGENDADO",
      clientesId: 0,
      conveniosId: 0,
      procedimentosId: 0,
      prestadoresId: prestador?.id ?? 0,
      unidadesId: unidade?.id ?? 0,
      especialidadesId: especialidade?.id ?? 0,
      dtagenda: "",
      horario: "",
      tipo: "PROCEDIMENTO",
    },
  });

  const abrirModalAgendamento = async (hora: string, data: Date) => {
    setHoraSelecionada(hora);
    setDataSelecionada(data);
    try {
      if (!agendamentoSelecionado)
        throw new Error("agendamento não selecionado");
      const data = await getAgendaById(
        agendamentoSelecionado.dadosAgendamento.id.toString()
      );
      form.reset({
        conveniosId: data.conveniosId,
        clientesId: data.clientesId,
        procedimentosId: data.procedimentosId,
        situacao: "AGENDADO",
      });
    } catch (error) {
      console.error("Erro ao carregar dados do agendamento:", error);
    } finally {
    }
    setModalAgendamentoOpen(true);
  };

  //Definindo dtagenda do form pela data selecionada e hora selecionada
  useEffect(() => {
    if (modalAgendamentoOpen && horaSelecionada && dataSelecionada) {
      const [hour, minute] = horaSelecionada.split(":").map(Number);

      const dataLocal = new Date(
        dataSelecionada.getFullYear(),
        dataSelecionada.getMonth(),
        dataSelecionada.getDate(),
        hour,
        minute,
        0
      );
      const dataUTC = new Date(
        dataLocal.getTime() - dataLocal.getTimezoneOffset() * 60000
      );
      // Define no formulário no formato ISO (com Z no final)
      form.setValue("dtagenda", dataUTC.toISOString());
    }
  }, [modalAgendamentoOpen, horaSelecionada, dataSelecionada]);

  //Setando valores de prestadores, unidades e especialidades no form, pelos dados selecionados dentro do useState
  useEffect(() => {
    if (prestador) {
      form.setValue("prestadoresId", prestador.id);
    }
    if (unidade) {
      form.setValue("unidadesId", unidade.id);
    }
    if (especialidade) {
      form.setValue("especialidadesId", especialidade.id);
    }
  }, [prestador, unidade, especialidade]);

  //Função de excluir agendamento
  const excluirAgendamento = async (agendaId: number) => {
    try {
      setLoading(true);
      console.log(agendaId);
      await finalizarAgenda(agendaId.toString());
      toast.error(
        `Agendamento do dia ${
          dataSelecionada && format(dataSelecionada, "dd/MM/yyyy")
        } às ${horaSelecionada} foi deletado com sucesso!`
      );
      await carregarAgendamentos();
    } catch (error: any) {
      toast.error("Não foi posssivel deletar o agendamento", error);
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleStatusAgenda = async (agendaId: number, situacao: string) => {
    try {
      await updateStatusAgenda(agendaId.toString(), situacao);
      toast.success(
        `Situação do agendamento foi alterado para ${situacao} com sucesso!`
      );
      await carregarAgendamentos();
    } catch (error: any) {
      console.error("Não foi possivel alterar situação do agendamento", error);
    }
  };
  //Lista de

  const getStatusClass = (situacao: string) => {
    const item = statusItems.find((i) => i.label === situacao);
    if (!item) return "bg-gray-200 text-gray-800";
    return `${item.color} bg-opacity-10 border border-current px-2 py-1 text-xs rounded-full font-medium`;
  };

  return (
    <>
      {date && (
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Agendamentos do Dia:{" "}
          <span className="text-blue-600">{format(date, "dd/MM/yyyy")}</span>
        </h3>
      )}
      <Table className="text-xs min-w-full">
        <TableHeader className="bg-gray-100 sticky top-0 z-10">
          <TableRow>
            <TableHead className="text-center">Horário</TableHead>
            <TableHead className="text-center">Paciênte</TableHead>
            <TableHead className="text-center">Tipo</TableHead>
            <TableHead className="text-center">Situação</TableHead>
            <TableHead className="text-center">Opções</TableHead>
          </TableRow>
        </TableHeader>
        {carregandoDadosAgenda ? (
          <TableRow>
            <TableCell colSpan={5}>
              <div className="flex justify-center items-center h-20">
                <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                <span className="ml-2 text-gray-500">Carregando ...</span>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          <TableBody className="text-center uppercase">
            {date ? (
              horariosDia.map((agenda, index) => (
                <TableRow key={index}>
                  <TableCell>{agenda.hora}</TableCell>
                  <TableCell>
                    {agenda.paciente ? (
                      (() => {
                        const partes = agenda.paciente.split(" ");
                        return partes.length > 1
                          ? `${partes[0]}  ${partes[partes.length - 1]}`
                          : partes;
                      })()
                    ) : (
                      <span className="text-gray-400 italic">
                        Paciente não definido
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{agenda.tipo || "-"}</TableCell>
                  <TableCell>
                    <Badge className={getStatusClass(agenda.situacao)}>
                      {agenda.situacao}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <MenuIcon />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuSeparator />
                        {agenda.situacao === "LIVRE" ? (
                          <>
                            <DropdownMenuItem
                              onSelect={() => {
                                setAgendamentoSelecionado(agenda);
                                abrirModalAgendamento(agenda.hora, date);
                              }}
                            >
                              Agendar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => {
                                setAgendamentoSelecionado(agenda);
                                handleStatusAgenda(
                                  agenda.dadosAgendamento.id,
                                  "BLOQUEADO"
                                );
                              }}
                            >
                              Bloquear
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            {statusItems.map(({ label, color, icon }) => (
                              <DropdownMenuItem
                                key={label}
                                className={`flex items-center cursor-pointer ${color}`}
                                onSelect={() => {
                                  setAgendamentoSelecionado(agenda);
                                  handleStatusAgenda(
                                    agenda.dadosAgendamento.id,
                                    label
                                  );
                                }}
                              >
                                {icon}
                                {label}
                                <DropdownMenuSeparator />
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuItem
                              onSelect={() => {
                                setHoraSelecionada(agenda.hora);
                                setDataSelecionada(date);
                                setIsDeleteModalOpen(true);
                                setAgendamentoSelecionado(agenda);
                              }}
                              className="text-red-600 flex items-center"
                            >
                              <TrashIcon className="w-4 h-4 mr-2" />
                              Excluir Agendamento
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onSelect={() => {
                                abrirModalAgendamento(agenda.hora, date);
                                setAgendamentoSelecionado(agenda);
                              }}
                              className="text-blue-600 flex items-center"
                            >
                              <PencilIcon className="w-4 h-4 mr-2" />
                              Editar Agendamento
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
                <TableCell colSpan={5}>
                  <div className="flex justify-center items-center h-20">
                    <span className="ml-2 text-gray-500">
                      Data não definida
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        )}
      </Table>
      {date && (
        <Button
          className="mt-3"
          variant={"default"}
          onClick={() => {
            setDataSelecionada(date);
            setIsOpenModalCreate(true);
          }}
        >
          Criar encaixa
        </Button>
      )}
      <ModalAgendamento
        open={modalAgendamentoOpen}
        setOpen={setModalAgendamentoOpen}
        agendamentoSelecionado={agendamentoSelecionado}
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
              onClick={() =>
                excluirAgendamento(agendamentoSelecionado.dadosAgendamento.id)
              }
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
