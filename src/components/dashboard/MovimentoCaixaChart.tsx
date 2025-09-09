"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface MovimentoData {
  data: string;
  entradas: number;
  saidas: number;
  saldo: number;
}

interface MovimentoCaixaChartProps {
  startDate?: string;
  endDate?: string;
}

export default function MovimentoCaixaChart({ startDate, endDate }: MovimentoCaixaChartProps) {
  const [data, setData] = useState<MovimentoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: 'caixa-movimento'
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const totalEntradas = data.reduce((sum, item) => sum + (item.entradas || 0), 0);
  const totalSaidas = data.reduce((sum, item) => sum + (item.saidas || 0), 0);
  const saldoTotal = totalEntradas - totalSaidas;

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Movimento Financeiro</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Fluxo de caixa em tempo real
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex items-center justify-center h-[400px]">
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
              <DollarSign className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">Movimento Financeiro</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Erro ao carregar dados
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex items-center justify-center h-[400px] text-red-600">
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
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Movimento Financeiro
              </CardTitle>
              <CardDescription className="text-sm font-medium text-muted-foreground">
                Fluxo de caixa • Tempo real
              </CardDescription>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="rounded-xl border bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4">
            <div className="flex items-center space-x-2">
              <ArrowUpRight className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-800">Entradas</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600 mt-2">{formatCurrency(totalEntradas)}</p>
          </div>
          
          <div className="rounded-xl border bg-gradient-to-br from-red-50 to-red-100/50 p-4">
            <div className="flex items-center space-x-2">
              <ArrowDownRight className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Saídas</span>
            </div>
            <p className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(totalSaidas)}</p>
          </div>
          
          <div className={`rounded-xl border p-4 ${
            saldoTotal >= 0 
              ? 'bg-gradient-to-br from-blue-50 to-blue-100/50' 
              : 'bg-gradient-to-br from-orange-50 to-orange-100/50'
          }`}>
            <div className="flex items-center space-x-2">
              {saldoTotal >= 0 ? (
                <TrendingUp className="h-4 w-4 text-blue-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-orange-600" />
              )}
              <span className={`text-sm font-medium ${
                saldoTotal >= 0 ? 'text-blue-800' : 'text-orange-800'
              }`}>
                Saldo
              </span>
            </div>
            <p className={`text-2xl font-bold mt-2 ${
              saldoTotal >= 0 ? 'text-blue-600' : 'text-orange-600'
            }`}>
              {formatCurrency(saldoTotal)}
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="data" 
                tickFormatter={formatDate}
                className="text-xs"
                stroke="#64748b"
                fontSize={12}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                className="text-xs"
                stroke="#64748b"
                fontSize={12}
                width={80}
              />
              <Tooltip 
                labelFormatter={(label) => `Data: ${formatDate(label)}`}
                formatter={(value: number, name: string) => [
                  formatCurrency(value), 
                  name === 'entradas' ? 'Entradas' : 
                  name === 'saidas' ? 'Saídas' : 'Saldo'
                ]}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              
              <Line 
                type="monotone" 
                dataKey="entradas" 
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: 'white' }}
                name="entradas"
              />
              
              <Line 
                type="monotone" 
                dataKey="saidas" 
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2, fill: 'white' }}
                name="saidas"
              />
              
              <Line 
                type="monotone" 
                dataKey="saldo" 
                stroke="#3b82f6"
                strokeWidth={3}
                strokeDasharray="8 4"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: 'white' }}
                name="saldo"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}