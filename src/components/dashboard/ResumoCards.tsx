"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Calendar, Users, Minus } from "lucide-react";

interface ResumoData {
  totalReceitas: number;
  totalDespesas: number;
  saldoLiquido: number;
  totalAgendamentos: number;
  novosClientes: number;
}

interface ResumoCardsProps {
  startDate?: string;
  endDate?: string;
}

export default function ResumoCards({ startDate, endDate }: ResumoCardsProps) {
  const [data, setData] = useState<ResumoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: 'resumo'
      });

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/dashboard?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Erro ao carregar dados');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  if (loading) {
    return (
      <div className="grid gap-3 md:gap-4 lg:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="bg-white/60 backdrop-blur-sm border-gray-200/40 shadow-lg">
            <CardContent className="p-4 md:p-6">
              <div className="animate-pulse">
                <div className="flex justify-between items-start mb-3 md:mb-4">
                  <div>
                    <div className="h-3 md:h-4 w-16 md:w-20 bg-gray-300 rounded mb-2"></div>
                    <div className="w-6 md:w-8 h-1 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-300 rounded-xl"></div>
                </div>
                <div className="h-6 md:h-8 w-20 md:w-24 bg-gray-300 rounded mb-2"></div>
                <div className="h-2 md:h-3 w-24 md:w-32 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="grid gap-3 md:gap-4 lg:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-5">
        <Card className="col-span-full bg-gradient-to-br from-red-50/80 to-rose-50/60 backdrop-blur-sm border-red-200/40 shadow-lg">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center justify-center h-16 md:h-20">
              <div className="text-center">
                <div className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <p className="text-red-700 font-semibold text-sm md:text-base">{error || 'Dados não encontrados'}</p>
                <p className="text-red-600/70 text-xs md:text-sm mt-1">Verifique a conexão e tente novamente</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:gap-4 lg:gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-5 overflow-hidden">
      {/* Receitas */}
      <Card className="bg-gradient-to-br from-emerald-50/80 to-green-50/60 backdrop-blur-sm border-emerald-200/40 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-emerald-200/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 md:pb-3">
          <div>
            <CardTitle className="text-xs md:text-sm font-semibold text-emerald-700 mb-1">
              Receitas
            </CardTitle>
            <div className="w-6 md:w-8 h-1 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"></div>
          </div>
          <div className="p-2 md:p-2.5 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg md:rounded-xl shadow-lg">
            <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-emerald-700 mb-1 break-words overflow-hidden leading-tight">
            {formatCurrency(data.totalReceitas)}
          </div>
          <p className="text-xs font-medium text-emerald-600/70">
            Total de entradas no período
          </p>
        </CardContent>
      </Card>

      {/* Despesas */}
      <Card className="bg-gradient-to-br from-rose-50/80 to-red-50/60 backdrop-blur-sm border-rose-200/40 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-rose-200/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 md:pb-3">
          <div>
            <CardTitle className="text-xs md:text-sm font-semibold text-rose-700 mb-1">
              Despesas
            </CardTitle>
            <div className="w-6 md:w-8 h-1 bg-gradient-to-r from-rose-400 to-red-500 rounded-full"></div>
          </div>
          <div className="p-2 md:p-2.5 bg-gradient-to-br from-rose-500 to-red-600 rounded-lg md:rounded-xl shadow-lg">
            <TrendingDown className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-rose-700 mb-1 break-words overflow-hidden leading-tight">
            {formatCurrency(data.totalDespesas)}
          </div>
          <p className="text-xs font-medium text-rose-600/70">
            Total de saídas no período
          </p>
        </CardContent>
      </Card>

      {/* Saldo Líquido */}
      <Card className={`backdrop-blur-sm transition-all duration-300 transform hover:scale-[1.02] ${
        data.saldoLiquido > 0 
          ? 'bg-gradient-to-br from-blue-50/80 to-indigo-50/60 border-blue-200/40 hover:shadow-lg hover:shadow-blue-200/50' 
          : data.saldoLiquido < 0 
            ? 'bg-gradient-to-br from-orange-50/80 to-red-50/60 border-orange-200/40 hover:shadow-lg hover:shadow-orange-200/50'
            : 'bg-gradient-to-br from-gray-50/80 to-slate-50/60 border-gray-200/40 hover:shadow-lg hover:shadow-gray-200/50'
      }`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 md:pb-3">
          <div>
            <CardTitle className={`text-xs md:text-sm font-semibold mb-1 ${
              data.saldoLiquido > 0 
                ? 'text-blue-700' 
                : data.saldoLiquido < 0 
                  ? 'text-orange-700'
                  : 'text-gray-700'
            }`}>
              Saldo Líquido
            </CardTitle>
            <div className={`w-6 md:w-8 h-1 rounded-full ${
              data.saldoLiquido > 0 
                ? 'bg-gradient-to-r from-blue-400 to-indigo-500' 
                : data.saldoLiquido < 0 
                  ? 'bg-gradient-to-r from-orange-400 to-red-500'
                  : 'bg-gradient-to-r from-gray-400 to-slate-500'
            }`}></div>
          </div>
          <div className={`p-2 md:p-2.5 rounded-lg md:rounded-xl shadow-lg ${
            data.saldoLiquido > 0 
              ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
              : data.saldoLiquido < 0 
                ? 'bg-gradient-to-br from-orange-500 to-red-600'
                : 'bg-gradient-to-br from-gray-500 to-slate-600'
          }`}>
            {data.saldoLiquido > 0 ? (
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-white" />
            ) : data.saldoLiquido < 0 ? (
              <TrendingDown className="h-4 w-4 md:h-5 md:w-5 text-white" />
            ) : (
              <Minus className="h-4 w-4 md:h-5 md:w-5 text-white" />
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className={`text-xs sm:text-sm md:text-base lg:text-lg font-bold mb-1 break-words overflow-hidden leading-tight ${
            data.saldoLiquido > 0 
              ? 'text-blue-700' 
              : data.saldoLiquido < 0 
                ? 'text-orange-700' 
                : 'text-gray-700'
          }`}>
            {formatCurrency(data.saldoLiquido)}
          </div>
          <p className={`text-xs font-medium ${
            data.saldoLiquido > 0 
              ? 'text-blue-600/70' 
              : data.saldoLiquido < 0 
                ? 'text-orange-600/70'
                : 'text-gray-600/70'
          }`}>
            Receitas menos despesas
          </p>
        </CardContent>
      </Card>

      {/* Agendamentos */}
      <Card className="bg-gradient-to-br from-cyan-50/80 to-blue-50/60 backdrop-blur-sm border-cyan-200/40 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-cyan-200/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 md:pb-3">
          <div>
            <CardTitle className="text-xs md:text-sm font-semibold text-cyan-700 mb-1">
              Agendamentos
            </CardTitle>
            <div className="w-6 md:w-8 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"></div>
          </div>
          <div className="p-2 md:p-2.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg md:rounded-xl shadow-lg">
            <Calendar className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-cyan-700 mb-1 break-words overflow-hidden leading-tight">
            {data.totalAgendamentos}
          </div>
          <p className="text-xs font-medium text-cyan-600/70">
            Consultas agendadas
          </p>
        </CardContent>
      </Card>

      {/* Novos Clientes */}
      <Card className="bg-gradient-to-br from-violet-50/80 to-purple-50/60 backdrop-blur-sm border-violet-200/40 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-violet-200/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 md:pb-3">
          <div>
            <CardTitle className="text-xs md:text-sm font-semibold text-violet-700 mb-1">
              Novos Clientes
            </CardTitle>
            <div className="w-6 md:w-8 h-1 bg-gradient-to-r from-violet-400 to-purple-500 rounded-full"></div>
          </div>
          <div className="p-2 md:p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg md:rounded-xl shadow-lg">
            <Users className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-violet-700 mb-1 break-words overflow-hidden leading-tight">
            {data.novosClientes}
          </div>
          <p className="text-xs font-medium text-violet-600/70">
            Cadastros realizados
          </p>
        </CardContent>
      </Card>
    </div>
  );
}