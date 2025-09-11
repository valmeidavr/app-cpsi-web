"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Calendar, CheckCircle, XCircle, Clock, Users } from "lucide-react";

interface AgendamentoData {
  data: string;
  total: number;
  agendados: number;
  finalizados: number;
  faltas: number;
}

interface AgendamentosChartProps {
  startDate?: string;
  endDate?: string;
}

export default function AgendamentosChart({ startDate, endDate }: AgendamentosChartProps) {
  const [data, setData] = useState<AgendamentoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: 'agendamentos'
      });

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/dashboard?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data.reverse());
      } else {
        setError(result.error || 'Erro ao carregar dados');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  const totalAgendamentos = data.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const totalFinalizados = data.reduce((sum, item) => sum + (Number(item.finalizados) || 0), 0);
  const totalFaltas = data.reduce((sum, item) => sum + (Number(item.faltas) || 0), 0);
  const totalAgendados = data.reduce((sum, item) => sum + (Number(item.agendados) || 0), 0);

  const taxaEfetivacao = totalAgendamentos > 0 ? ((totalFinalizados / totalAgendamentos) * 100).toFixed(1) : '0';
  const taxaFalta = totalAgendamentos > 0 ? ((totalFaltas / totalAgendamentos) * 100).toFixed(1) : '0';

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Agendamentos</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Performance de atendimentos
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex items-center justify-center h-[200px]">
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 bg-current rounded-full animate-pulse"></div>
              <div className="h-4 w-4 bg-current rounded-full animate-pulse [animation-delay:0.2s]"></div>
              <div className="h-4 w-4 bg-current rounded-full animate-pulse [animation-delay:0.4s]"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Agendamentos</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Erro ao carregar dados
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex items-center justify-center h-[200px] text-red-600">
            <div className="text-center">
              <p className="font-medium">{error}</p>
              <p className="text-sm text-muted-foreground mt-2">Tente recarregar a página</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Agendamentos
              </CardTitle>
              <CardDescription className="text-sm font-medium text-muted-foreground">
                Performance de atendimentos • Hoje
              </CardDescription>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="rounded-xl border bg-gradient-to-br from-slate-50 to-slate-100/50 p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-800">Total</span>
            </div>
            <p className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold break-words overflow-hidden leading-tight text-slate-600 mt-2">{totalAgendamentos}</p>
          </div>
          
          <div className="rounded-xl border bg-gradient-to-br from-amber-50 to-amber-100/50 p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">Agendados</span>
            </div>
            <p className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold break-words overflow-hidden leading-tight text-amber-600 mt-2">{totalAgendados}</p>
          </div>
          
          <div className="rounded-xl border bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800">Finalizados</span>
            </div>
            <p className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold break-words overflow-hidden leading-tight text-emerald-600 mt-2">{totalFinalizados}</p>
            {totalAgendamentos > 0 && (
              <p className="text-xs text-emerald-600 mt-1 font-medium">{taxaEfetivacao}%</p>
            )}
          </div>
          
          <div className="rounded-xl border bg-gradient-to-br from-red-50 to-red-100/50 p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Faltas</span>
            </div>
            <p className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold break-words overflow-hidden leading-tight text-red-600 mt-2">{totalFaltas}</p>
            {totalAgendamentos > 0 && (
              <p className="text-xs text-red-600 mt-1 font-medium">{taxaFalta}%</p>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="data" 
                tickFormatter={formatDate}
                className="text-xs"
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis 
                className="text-xs"
                stroke="#64748b"
                fontSize={12}
                width={50}
              />
              <Tooltip 
                labelFormatter={(label) => `Data: ${formatDate(label)}`}
                formatter={(value: number, name: string) => {
                  const nameMap: { [key: string]: string } = {
                    'agendados': 'Agendados',
                    'finalizados': 'Finalizados',  
                    'faltas': 'Faltas'
                  };
                  return [value, nameMap[name] || name];
                }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend 
                formatter={(value) => {
                  const nameMap: { [key: string]: string } = {
                    'agendados': 'Agendados',
                    'finalizados': 'Finalizados',
                    'faltas': 'Faltas'
                  };
                  return nameMap[value] || value;
                }}
              />
              
              <Bar 
                dataKey="agendados" 
                stackId="stack"
                fill="#f59e0b"
                name="agendados"
                radius={[0, 0, 0, 0]}
              />
              
              <Bar 
                dataKey="finalizados" 
                stackId="stack"
                fill="#10b981"
                name="finalizados"
                radius={[0, 0, 0, 0]}
              />
              
              <Bar 
                dataKey="faltas" 
                stackId="stack"
                fill="#ef4444"
                name="faltas"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}