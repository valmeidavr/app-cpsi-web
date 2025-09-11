"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ResumoCards from "@/components/dashboard/ResumoCards";
import MovimentoCaixaChart from "@/components/dashboard/MovimentoCaixaChart";
import AgendamentosChart from "@/components/dashboard/AgendamentosChart";
import NovosClientesChart from "@/components/dashboard/NovosClientesChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Filter } from "lucide-react";

export default function PainelHome() {
  const { session, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [dateFilter, setDateFilter] = useState<{startDate?: string; endDate?: string}>({});

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleDateFilterChange = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    setDateFilter({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 relative overflow-x-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1e293b" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
        </svg>
      </div>
      
      <div className="relative w-full max-w-none space-y-6 p-4 pb-20">
        {/* Enhanced Header Section */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-purple-600/10 rounded-2xl md:rounded-3xl blur-xl"></div>
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between bg-white/90 backdrop-blur-xl rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-xl border border-white/30">
            <div className="space-y-2 md:space-y-3">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-2 md:p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg md:rounded-xl shadow-lg">
                  <CalendarDays className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
                    Dashboard Executivo
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-sm shadow-emerald-400/50"></div>
                    <p className="text-slate-700 font-semibold text-sm md:text-base">
                      Bem-vindo, <span className="text-blue-700 font-bold">{session?.user?.name || "Usuário"}</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-3 md:h-4 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                <p className="text-slate-600 text-xs md:text-sm font-medium">
                  Visão estratégica e indicadores de performance em tempo real
                </p>
              </div>
            </div>

            {/* Enhanced Date Filters */}
            <Card className="w-full lg:w-auto mt-4 md:mt-6 lg:mt-0 bg-white/70 backdrop-blur-xl border-white/50 shadow-xl">
              <CardHeader className="pb-3 md:pb-4">
                <CardTitle className="text-sm md:text-base font-bold flex items-center gap-2 md:gap-3 text-slate-800">
                  <div className="p-1.5 md:p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg md:rounded-xl shadow-lg">
                    <Filter className="h-4 w-4 md:h-5 md:w-5 text-white" />
                  </div>
                  <span>Período de Análise</span>
                </CardTitle>
                <div className="w-10 md:w-12 h-1 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full"></div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 lg:flex lg:flex-wrap gap-2">
                  <button
                    onClick={() => handleDateFilterChange(7)}
                    className="px-3 py-2 md:px-4 md:py-2.5 text-xs md:text-sm font-semibold rounded-lg md:rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 md:hover:scale-110 hover:-translate-y-0.5 md:hover:-translate-y-1"
                  >
                    7 dias
                  </button>
                  <button
                    onClick={() => handleDateFilterChange(30)}
                    className="px-3 py-2 md:px-4 md:py-2.5 text-xs md:text-sm font-semibold rounded-lg md:rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 md:hover:scale-110 hover:-translate-y-0.5 md:hover:-translate-y-1"
                  >
                    30 dias
                  </button>
                  <button
                    onClick={() => handleDateFilterChange(90)}
                    className="px-3 py-2 md:px-4 md:py-2.5 text-xs md:text-sm font-semibold rounded-lg md:rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 md:hover:scale-110 hover:-translate-y-0.5 md:hover:-translate-y-1"
                  >
                    90 dias
                  </button>
                  <button
                    onClick={() => setDateFilter({})}
                    className="px-3 py-2 md:px-4 md:py-2.5 text-xs md:text-sm font-semibold rounded-lg md:rounded-xl bg-white/90 text-slate-700 hover:bg-white border-2 border-slate-200 hover:border-slate-300 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 md:hover:scale-110 hover:-translate-y-0.5 md:hover:-translate-y-1 backdrop-blur-sm col-span-2 lg:col-span-1"
                  >
                    Todos
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      {/* Cards de Resumo */}
      <ResumoCards startDate={dateFilter.startDate} endDate={dateFilter.endDate} />

        {/* Charts Section */}
        <div className="space-y-4 md:space-y-6 lg:space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Movimento de Caixa */}
            <div className="h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] xl:h-[500px]">
              <MovimentoCaixaChart startDate={dateFilter.startDate} endDate={dateFilter.endDate} />
            </div>

            {/* Agendamentos */}
            <div className="h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] xl:h-[500px]">
              <AgendamentosChart startDate={dateFilter.startDate} endDate={dateFilter.endDate} />
            </div>
          </div>
          
          {/* Novos Clientes - largura total */}
          <div className="h-[300px] sm:h-[350px] md:h-[400px] lg:h-[450px] xl:h-[500px]">
            <NovosClientesChart startDate={dateFilter.startDate} endDate={dateFilter.endDate} />
          </div>
        </div>
      </div>
      
      {/* Floating Action Elements */}
      <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-10">
        <div className="flex flex-col gap-2 md:gap-4">
          {/* Status Indicator */}
          <div className="bg-white/90 backdrop-blur-xl rounded-full px-3 py-1.5 md:px-4 md:py-2 shadow-xl border border-white/30 flex items-center gap-2">
            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs md:text-sm font-medium text-slate-700">Sistema Online</span>
          </div>
        </div>
      </div>
    </div>
  );
}
