// context/AgendaContext.tsx
"use client";
import { createContext, useContext, useEffect, useState } from "react";
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
  horariosDia: any[];
  setHorariosDia: (v: any[]) => void;
  carregandoDadosAgenda: boolean;
  carregarAgendamentos: () => Promise<void>;
  carregarAgendamentosGeral: () => Promise<void>;
  agendamentosGeral: Agenda[];
  loading: boolean;
  setLoading: (v: boolean) => void;
  prestadores: Prestador[];
  unidades: Unidade[];
  especialidades: Especialidade[];
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
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
  const [horariosDia, setHorariosDia] = useState<any[]>([]);
  const [carregandoDadosAgenda, setCarregandoDadosAgenda] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agendamentosGeral, setAgendamentosGeral] = useState<Agenda[]>([]);
  const [prestadores, setPrestadores] = useState<Prestador[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [carregarAgenda, setCarregarAgenda] = useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    
    
    const carregarAgendamentos = async () => {
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
        console.log("novaLista", novaLista);
        setHorariosDia(novaLista);
      } else {
        console.error("Erro ao buscar agendamentos:", data.error);
      }
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
    } finally {
      setCarregandoDadosAgenda(false);
    }
  };

  //Carregando agendamentos para o calendarioa fazer o controle de agendamento  esgotado ou não
  const carregarAgendamentosGeral = async () => {
    setCarregandoDadosAgenda(true);
    try {
      const params = new URLSearchParams();
      if (unidade?.id) params.append('unidadeId', unidade.id.toString());
      if (prestador?.id) params.append('prestadorId', prestador.id.toString());
      if (especialidade?.id) params.append('especialidadeId', especialidade.id.toString());
      // Definir limite muito alto para buscar todos os agendamentos
      params.append('limit', '999999');

      const response = await fetch(`/api/agendas?${params}`);
      const data = await response.json();

      if (response.ok) {
        setAgendamentosGeral(data.data);
      } else {
        console.error("Erro ao buscar agendamentos gerais:", data.error);
      }
    } catch (error) {
      console.error("Erro ao buscar agendamentos gerais:", error);
    } finally {
      setCarregandoDadosAgenda(false);
    }
  };

  useEffect(() => {
    if (unidade && prestador && especialidade) {
      carregarAgendamentosGeral();
    }
  }, [unidade, prestador, especialidade]);

  useEffect(() => {
    if (unidade && prestador && especialidade && date) {
      carregarAgendamentos();
    }
  }, [date, unidade, prestador, especialidade]);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        await Promise.all([
          fetchEspecialidades(),
          fetchPrestadores(),
          fetchUnidades(),
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
      }
    };

    carregarDados();
  }, []);

  const fetchPrestadores = async () => {
    try {
      console.log('🔍 Debug - Iniciando busca de prestadores...');
      const response = await fetch("/api/prestadores?all=true");
      
      if (!response.ok) {
        throw new Error("Erro ao carregar prestadores");
      }
      
      const data = await response.json();
      console.log('🔍 Debug - Prestadores recebidos:', data.data?.length || 0);
      setPrestadores(data.data);
    } catch (error: any) {
      console.error('🔍 Debug - Erro ao buscar prestadores:', error);
      toast.error("Erro ao carregar dados dos Prestadores");
    }
  };
  
  const fetchUnidades = async () => {
    try {
      console.log('🔍 Debug - Iniciando busca de unidades...');
      const response = await fetch("/api/unidades?all=true");
      
      if (!response.ok) {
        throw new Error("Erro ao carregar unidades");
      }
      
      const data = await response.json();
      console.log('🔍 Debug - Unidades recebidas:', data.data?.length || 0);
      setUnidades(data.data);
    } catch (error: any) {
      console.error('🔍 Debug - Erro ao buscar unidades:', error);
      toast.error("Erro ao carregar dados das Unidades");
    }
  };
  
  const fetchEspecialidades = async () => {
    try {
      console.log('🔍 Debug - Iniciando busca de especialidades...');
      const response = await fetch("/api/especialidades?all=true");
      
      if (!response.ok) {
        throw new Error("Erro ao carregar especialidades");
      }
      
      const data = await response.json();
      console.log('🔍 Debug - Especialidades recebidas:', data.data?.length || 0);
      setEspecialidades(data.data);
    } catch (error: any) {
      console.error('🔍 Debug - Erro ao buscar especialidades:', error);
      toast.error("Erro ao carregar dados das Especialidades");
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
        prestadores,
        unidades,
        especialidades,
        currentMonth,
        setCurrentMonth,
      }}
    >
      {children}
    </AgendaContext.Provider>
  );
};
