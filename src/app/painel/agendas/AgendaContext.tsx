
"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Agenda } from "@/app/types/Agenda";
import { Especialidade } from "@/app/types/Especialidade";
import { Prestador } from "@/app/types/Prestador";
import { Unidade } from "@/app/types/Unidades";
import { toast } from "sonner";
import { extractTimeFromUTCISO } from "@/app/helpers/dateUtils";
interface AgendaContextType {
  prestador: Prestador | null;
  setPrestador: (p: Prestador | null) => void;
  unidade: Unidade | null;
  setUnidade: (u: Unidade | null) => void;
  especialidade: Especialidade | null;
  setEspecialidade: (e: Especialidade | null) => void;
  date: Date | undefined;
  setDate: (d: Date | undefined) => void;
  horariosDia: Array<{
    hora: string;
    situacao: string;
    paciente: string | null;
    tipo: string;
    dadosAgendamento: Agenda;
  }>;
  setHorariosDia: (v: Array<{
    hora: string;
    situacao: string;
    paciente: string | null;
    tipo: string;
    dadosAgendamento: Agenda;
  }>) => void;
  carregandoDadosAgenda: boolean;
  carregarAgendamentos: () => Promise<void>;
  carregarAgendamentosGeral: () => Promise<void>;
  agendamentosGeral: Agenda[];
  loading: boolean;
  setLoading: (v: boolean) => void;
  loadingUnidades: boolean;
  loadingEspecialidades: boolean;
  loadingPrestadores: boolean;
  prestadores: Prestador[];
  unidades: Unidade[];
  especialidades: Especialidade[];
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  onUnidadeChange: (unidade: Unidade | null) => void;
  onEspecialidadeChange: (especialidade: Especialidade | null) => void;
}
const AgendaContext = createContext<AgendaContextType | undefined>(undefined);
export const useAgenda = () => {
  const context = useContext(AgendaContext);
  if (!context)
    throw new Error("useAgenda deve ser usado dentro de AgendaProvider");
  return context;
};
export const AgendaProvider = ({ children }: { children: React.ReactNode }) => {
  const [prestador, setPrestador] = useState<Prestador | null>(null);
  const [unidade, setUnidade] = useState<Unidade | null>(null);
  const [especialidade, setEspecialidade] = useState<Especialidade | null>(
    null
  );
  const [date, setDate] = useState<Date>();
  const [horariosDia, setHorariosDia] = useState<Array<{
    hora: string;
    situacao: string;
    paciente: string | null;
    tipo: string;
    dadosAgendamento: Agenda;
  }>>([]);
  const [carregandoDadosAgenda, setCarregandoDadosAgenda] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingUnidades, setLoadingUnidades] = useState(false);
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(false);
  const [loadingPrestadores, setLoadingPrestadores] = useState(false);
  const [agendamentosGeral, setAgendamentosGeral] = useState<Agenda[]>([]);
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const carregarAgendamentos = useCallback(async () => {
    setCarregandoDadosAgenda(true);
    try {
      if (!unidade || !prestador || !especialidade) return;
      const formattedDate = date ? date.toISOString().slice(0, 10) : undefined;
      const params = new URLSearchParams();
      if (formattedDate) params.append('date', formattedDate);
      params.append('unidadeId', unidade.id.toString());
      params.append('prestadorId', prestador.id.toString());
      params.append('especialidadeId', especialidade.id.toString());
      const response = await fetch(`/api/agendas?${params}`);
      const data = await response.json();
      if (response.ok) {
        const novaLista = data.data.map((agenda: Agenda) => {
          const hora = extractTimeFromUTCISO(agenda.dtagenda);
          return {
            hora,
            situacao: agenda.situacao,
            paciente: agenda.cliente_nome || null,
            tipo: "procedimento",
            dadosAgendamento: agenda,
          };
        });
        setHorariosDia(novaLista);
      } else {
      }
    } catch {
    } finally {
      setCarregandoDadosAgenda(false);
    }
  }, [date, unidade, prestador, especialidade]);
  const carregarAgendamentosGeral = useCallback(async () => {
    setCarregandoDadosAgenda(true);
    try {
      const params = new URLSearchParams();
      if (unidade?.id) params.append('unidadeId', unidade.id.toString());
      if (prestador?.id) params.append('prestadorId', prestador.id.toString());
      if (especialidade?.id) params.append('especialidadeId', especialidade.id.toString());
      params.append('limit', '999999');
      const response = await fetch(`/api/agendas?${params}`);
      const data = await response.json();
      if (response.ok) {
        setAgendamentosGeral(data.data);
      } else {
      }
    } catch {
    } finally {
      setCarregandoDadosAgenda(false);
    }
  }, [unidade, prestador, especialidade]);
  useEffect(() => {
    if (unidade && prestador && especialidade) {
      carregarAgendamentosGeral();
    }
  }, [unidade, prestador, especialidade, carregarAgendamentosGeral]);
  useEffect(() => {
    if (unidade && prestador && especialidade && date) {
      carregarAgendamentos();
    }
  }, [date, unidade, prestador, especialidade, carregarAgendamentos]);
  useEffect(() => {
    const carregarDados = async () => {
      try {
        await fetchUnidades();
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
      } catch {
      }
    };
    carregarDados();
  }, []);
  const fetchPrestadores = async (unidadeId?: number, especialidadeId?: number) => {
    setLoadingPrestadores(true);
    try {
      let url = "/api/prestadores?com_expediente=true&all=true";
      if (unidadeId) {
        url += `&unidade_id=${unidadeId}`;
      }
      if (especialidadeId) {
        url += `&especialidade_id=${especialidadeId}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPrestadores(data.data || []);
      }
    } catch (_error) {
    } finally {
      setLoadingPrestadores(false);
    }
  };
  const fetchUnidades = async () => {
    setLoadingUnidades(true);
    try {
      const response = await fetch("/api/unidades?com_expediente=true&limit=1000");
      if (response.ok) {
        const data = await response.json();
        setUnidades(data.data || []);
      }
    } catch (_error) {
    } finally {
      setLoadingUnidades(false);
    }
  };
  const fetchEspecialidades = async (unidadeId?: number) => {
    setLoadingEspecialidades(true);
    try {
      let url = "/api/especialidades?com_expediente=true&limit=1000";
      if (unidadeId) {
        url += `&unidade_id=${unidadeId}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setEspecialidades(data.data || []);
      }
    } catch (_error) {
    } finally {
      setLoadingEspecialidades(false);
    }
  };

  const onUnidadeChange = async (novaUnidade: Unidade | null) => {
    setUnidade(novaUnidade);
    // Limpar seleções dependentes
    setEspecialidade(null);
    setPrestador(null);
    setEspecialidades([]);
    setPrestadores([]);
    
    // Carregar especialidades da nova unidade
    if (novaUnidade) {
      await fetchEspecialidades(novaUnidade.id);
    }
  };

  const onEspecialidadeChange = async (novaEspecialidade: Especialidade | null) => {
    setEspecialidade(novaEspecialidade);
    // Limpar seleção dependente
    setPrestador(null);
    setPrestadores([]);
    
    // Carregar prestadores da unidade e especialidade selecionadas
    if (unidade && novaEspecialidade) {
      await fetchPrestadores(unidade.id, novaEspecialidade.id);
    }
  };
  return (
    <AgendaContext.Provider
      value={{
        prestador,
        setPrestador,
        unidade,
        setUnidade,
        especialidade,
        setEspecialidade,
        date,
        setDate,
        horariosDia,
        setHorariosDia,
        carregandoDadosAgenda,
        carregarAgendamentos,
        carregarAgendamentosGeral,
        agendamentosGeral,
        loading,
        setLoading,
        loadingUnidades,
        loadingEspecialidades,
        loadingPrestadores,
        prestadores,
        unidades,
        especialidades,
        currentMonth,
        setCurrentMonth,
        onUnidadeChange,
        onEspecialidadeChange,
      }}
    >
      {children}
    </AgendaContext.Provider>
  );
};