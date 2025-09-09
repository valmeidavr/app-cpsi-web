"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, UserPlus, TrendingUp, BarChart3 } from "lucide-react";

interface NovoClienteData {
  data: string;
  total: number;
}

interface NovosClientesChartProps {
  startDate?: string;
  endDate?: string;
}

export default function NovosClientesChart({ startDate, endDate }: NovosClientesChartProps) {
  const [data, setData] = useState<NovoClienteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: 'novos-clientes'
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

  const totalNovosClientes = data.reduce((sum, item) => sum + (item.total || 0), 0);
  const mediaDiaria = data.length > 0 ? (totalNovosClientes / data.length).toFixed(1) : '0';

  // Calcular crescimento (comparação com período anterior)
  const primeiraMetade = data.slice(0, Math.floor(data.length / 2));
  const segundaMetade = data.slice(Math.floor(data.length / 2));
  
  const totalPrimeiraMetade = primeiraMetade.reduce((sum, item) => sum + (item.total || 0), 0);
  const totalSegundaMetade = segundaMetade.reduce((sum, item) => sum + (item.total || 0), 0);
  
  const crescimento = totalPrimeiraMetade > 0 
    ? (((totalSegundaMetade - totalPrimeiraMetade) / totalPrimeiraMetade) * 100).toFixed(1)
    : '0';

  // Encontrar o dia com mais cadastros
  const maiorCadastro = data.reduce((max, item) => item.total > max.total ? item : max, { total: 0, data: '' });

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Novos Clientes</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Crescimento da base
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
              <UserPlus className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Novos Clientes</CardTitle>
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

  if (data.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <UserPlus className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Novos Clientes</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Crescimento da base
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex items-center justify-center h-[200px] text-gray-500">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="font-medium">Nenhum dado encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">Para o período selecionado</p>
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
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Novos Clientes
              </CardTitle>
              <CardDescription className="text-sm font-medium text-muted-foreground">
                Crescimento da base • Mensal
              </CardDescription>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-blue-100/50 p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Total</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 mt-2">{totalNovosClientes}</p>
          </div>
          
          <div className="rounded-xl border bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800">Média/Dia</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600 mt-2">{mediaDiaria}</p>
          </div>
          
          <div className="rounded-xl border bg-gradient-to-br from-violet-50 to-violet-100/50 p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-violet-600" />
              <span className="text-sm font-medium text-violet-800">Crescimento</span>
            </div>
            <p className={`text-2xl font-bold mt-2 ${
              parseFloat(crescimento) >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {parseFloat(crescimento) >= 0 ? '+' : ''}{crescimento}%
            </p>
          </div>
          
          <div className="rounded-xl border bg-gradient-to-br from-orange-50 to-orange-100/50 p-4">
            <div className="flex items-center space-x-2">
              <UserPlus className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">Melhor Dia</span>
            </div>
            <p className="text-2xl font-bold text-orange-600 mt-2">{maiorCadastro.total}</p>
            {maiorCadastro.data && (
              <p className="text-xs text-orange-600 mt-1 font-medium">{formatDate(maiorCadastro.data)}</p>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="clientesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
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
                width={40}
                domain={[0, 'dataMax + 1']}
              />
              <Tooltip 
                labelFormatter={(label) => `Data: ${formatDate(label)}`}
                formatter={(value: number) => [
                  `${value} ${value === 1 ? 'cliente' : 'clientes'}`, 
                  'Novos Clientes'
                ]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                fill="url(#clientesGradient)"
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4, stroke: 'white' }}
                activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2, fill: 'white' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}