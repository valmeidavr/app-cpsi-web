"use client";
import {
  createAgendaSchema,
  updateAgendaSchema,
} from "@/app/api/agendas/schema/formSchemaAgendas";
import { Cliente, TipoCliente } from "@/app/types/Cliente";

import { Procedimento } from "@/app/types/Procedimento";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { http } from "@/util/http";
import { cn } from "@/lib/utils";
import { useAgenda } from "../AgendaContext";
import { Convenio } from "@/app/types/Convenios";
import ConveniosCliente from "@/app/types/ConveniosCliente";
import { ValorProcedimento } from "@/app/types/ValorProcedimento";
import { Loader2 } from "lucide-react";

interface ModalAgendamentoProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  agendamentoSelecionado: any | null;
  horaSelecionada: string | null;
  dataSelecionada: Date | null;
}

const ModalAgendamento = ({
  open,
  setOpen,
  agendamentoSelecionado,
  horaSelecionada,
  dataSelecionada,
}: ModalAgendamentoProps) => {
  const { prestador, unidade, especialidade, carregarAgendamentos } =
    useAgenda();
  const schema = updateAgendaSchema;
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
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
      horario: "",
      tipo: "PROCEDIMENTO",
    },
  });

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [procedimentos, setProcedimentos] = useState<ValorProcedimento[]>([]);
  const [loading, setLoading] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(
    null
  );
  const [convenioSelecionado, setConvenioSelecionado] = useState<Convenio | null>(
    null
  );
  const [procedimentoSelecionado, setProcedimentoSelecionado] = useState<ValorProcedimento | null>(
    null
  );
  const [tipoClienteSelecionado, setTipoClienteSelecionado] = useState<TipoCliente | null>(
    null
  );
  const [openSelectClientes, setOpenSelectClientes] = useState(false);
  const [openSelectProcedimentos, setOpenSelectProcedimentos] = useState(false);

  useEffect(() => {
    if (open) {
      fetchClientes();
    }
  }, [open]);

  useEffect(() => {
    if (convenioSelecionado && tipoClienteSelecionado) {
      fetchProcedimentos(tipoClienteSelecionado, convenioSelecionado.id);
    }
  }, [tipoClienteSelecionado, convenioSelecionado]);

  const fetchClientes = async () => {
    const { data } = await http.get("/api/clientes");
    setClientes(data.data);
  };

  const fetchConvenios = async (clienteId: number) => {
    if (!clienteId) return;
    const { data } = await http.get(
      `/convenios-clientes?clienteId=${clienteId}`
    );
    const conveniosListRaw = data.data.map(
      (item: ConveniosCliente) => item.convenios
    );
    const conveniosList = Array.from(
      new Map(conveniosListRaw.map((c: Convenio) => [c.id, c])).values()
    ) as Convenio[];

    setConvenios(conveniosList);
  };

  const fetchProcedimentos = async (
    tipoCliente: TipoCliente,
    convenio_id: number
  ) => {
    try {
      const { data } = await http.get(
        `/valores-procedimentos/findByConvenioId?convenio_id=${convenio_id}&tipoCliente=${tipoCliente}`
      );
      setProcedimentos(data);
    } catch (e) {
      toast.error("Nenhum procedimento encontrado");
    }
  };

  useEffect(() => {
    if (dataSelecionada && horaSelecionada) {
      const [h, m] = horaSelecionada.split(":").map(Number);
      const localDate = new Date(
        dataSelecionada.getFullYear(),
        dataSelecionada.getMonth(),
        dataSelecionada.getDate(),
        h,
        m
      );
      const isoDate = new Date(
        localDate.getTime() - localDate.getTimezoneOffset() * 60000
      ).toISOString();
      form.setValue("dtagenda", isoDate);
      form.setValue("horario", horaSelecionada);
    }

    if (prestador) form.setValue("prestador_id", prestador.id);
    if (unidade) form.setValue("unidade_id", unidade.id);
    if (especialidade) form.setValue("especialidade_id", especialidade.id);
  }, [dataSelecionada, horaSelecionada, prestador, unidade, especialidade]);

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (!procedimentoSelecionado)
        return toast.error("Selecione um procedimento válido");
      await http.patch(
        `/api/agendas/${agendamentoSelecionado.dadosAgendamento.id}`,
        values
      );
      toast.success("Agendamento criado com sucesso!");
      await carregarAgendamentos();
      setOpen(false);
    } catch (err) {
      toast.error("Erro ao salvar agendamento");
    } finally {
      setLoading(false);
      setClienteSelecionado(null);
      setConvenioSelecionado(null);
      form.setValue("convenio_id", 0);
      setProcedimentos([]);
      form.setValue("procedimento_id", 0);
      form.setValue("cliente_id", 0);
      setTipoClienteSelecionado(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Editar Agendamento
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Atualize as informações do agendamento selecionado
          </p>
        </DialogHeader>
        <Form {...form}>
          <div className="flex flex-col">
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="cliente_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Cliente</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          const numValue = Number(value);
                          field.onChange(numValue);
                          setClienteSelecionado(
                            clientes.find((cliente) => +cliente.id === numValue) ?? null
                          );
                          fetchConvenios(numValue);
                        }}
                        value={field.value ? String(field.value) : ""}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors">
                            <SelectValue placeholder="Selecione um cliente" />
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
                                {cliente.nome}
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
                  name="convenio_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Convênio</FormLabel>
                      <Select
                        disabled={!clienteSelecionado}
                        onValueChange={(value) => {
                          const numValue = Number(value);
                          field.onChange(numValue);
                          setConvenioSelecionado(
                            convenios.find((convenio) => convenio.id === numValue) ?? null
                          );
                        }}
                        value={field.value ? String(field.value) : ""}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors">
                            <SelectValue placeholder="Selecione um convênio" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0" disabled>
                            Selecione
                          </SelectItem>
                          {convenios.map((convenio) => {
                            return (
                              <SelectItem
                                key={convenio.id}
                                value={String(convenio.id)}
                              >
                                {convenio.nome}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="procedimento_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Procedimento</FormLabel>
                      <Select
                        disabled={!convenioSelecionado}
                        onValueChange={(value) => {
                          field.onChange(Number(value));
                          setProcedimentoSelecionado(
                            procedimentos.find((procedimento) => procedimento.procedimento.id === Number(value)) ?? null
                          );
                        }}
                        value={String(field.value)}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors">
                            <SelectValue placeholder="Selecione um procedimento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0" disabled>
                            Selecione
                          </SelectItem>
                          {procedimentos.map((procedimento) => {
                            return (
                              <SelectItem
                                key={procedimento.procedimento.id}
                                value={String(procedimento.procedimento.id)}
                              >
                                {procedimento.procedimento.nome}
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
                  name="situacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Situação</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors">
                            <SelectValue placeholder="Selecione a situação" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="AGENDADO">Agendado</SelectItem>
                          <SelectItem value="CONFIRMADO">Confirmado</SelectItem>
                          <SelectItem value="FINALIZADO">Finalizado</SelectItem>
                          <SelectItem value="FALTA">Falta</SelectItem>
                          <SelectItem value="BLOQUEADO">Bloqueado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 font-medium"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </div>
                  ) : (
                    "Salvar Alterações"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ModalAgendamento;
