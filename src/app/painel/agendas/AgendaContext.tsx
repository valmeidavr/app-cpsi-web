// context/AgendaContext.tsx
"use client";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { Especialidade } from "@/app/types/Especialidade";
import { Prestador } from "@/app/types/Prestador";
import { Unidade } from "@/app/types/Unidades";
import { Agenda } from "@/app/types/Agenda";
import { http } from "@/util/http";
import { format } from "date-fns";
import { getPrestadors } from "@/app/api/prestadores/action";
import { getUnidades } from "@/app/api/unidades/action";
import { getEspecialidades } from "@/app/api/especialidades/action";
import { toast } from "sonner";

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
}

const AgendaContext = createContext<AgendaContextType | undefined>(undefined);

export const useAgenda = () => {
  const context = useContext(AgendaContext);
  if (!context)
    throw new Error("useAgenda deve ser usado dentro de AgendaProvider");
  return context;
};

export const AgendaProvider = ({ children }: { children: ReactNode }) => {
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
    
    
    const carregarAgendamentos = async () => {
    setCarregandoDadosAgenda(true);
    try {
      if (!unidade || !prestador || !especialidade) return;
      const formattedDate = date ? format(date, "yyyy-MM-dd") : undefined;

      const { data } = await http.get("https://api-cpsi.aapvr.com.br//agendas", {
        params: {
          date: formattedDate,
          unidadesId: unidade.id,
          prestadoresId: prestador.id,
          especialidadesId: especialidade.id,
        },
      });

      const novaLista = data.data.map((agenda: Agenda) => {
        const hora = new Date(agenda.dtagenda).toISOString().slice(11, 16);
        return {
          hora,
          situacao: agenda.situacao,
          paciente: agenda.clientes?.nome || null,
          tipo: "procedimento",
          dadosAgendamento: agenda,
        };
      });
      setHorariosDia(novaLista);
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
      const { data } = await http.get("https://api-cpsi.aapvr.com.br//agendas", {
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

  useEffect(() => {
    if (unidade && prestador && especialidade) {
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
      }}
    >
      {children}
    </AgendaContext.Provider>
  );
};
