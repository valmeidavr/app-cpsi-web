"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

interface Especialidade {
  id: number;
  nome: string;
  codigo?: string;
  status?: string;
}

interface DebugInfo {
  especialidades: Especialidade[];
  alocacoes: any[];
  error?: string;
  loading: boolean;
}

export default function TestEspecialidades() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    especialidades: [],
    alocacoes: [],
    loading: false
  });

  const testEspecialidades = async () => {
    setDebugInfo(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      console.log('🧪 Iniciando teste de especialidades...');
      
      // Teste 1: API de especialidades direta
      console.log('🧪 Teste 1: API de especialidades direta');
      const especialidadesResponse = await fetch("/api/especialidades?all=true");
      const especialidadesData = await especialidadesResponse.json();
      
      console.log('🧪 Resposta da API de especialidades:', especialidadesData);
      
      // Teste 2: API de alocações
      console.log('🧪 Teste 2: API de alocações');
      const alocacoesResponse = await fetch("/api/alocacoes?limit=1000");
      const alocacoesData = await alocacoesResponse.json();
      
      console.log('🧪 Resposta da API de alocações:', alocacoesData);
      
      // Teste 3: Debug de especialidades
      console.log('🧪 Teste 3: Debug de especialidades');
      const debugResponse = await fetch("/api/debug/especialidades");
      const debugData = await debugResponse.json();
      
      console.log('🧪 Resposta do debug:', debugData);
      
      // Teste 4: Debug de alocações
      console.log('🧪 Teste 4: Debug de alocações');
      const debugAlocacoesResponse = await fetch("/api/debug/alocacoes");
      const debugAlocacoesData = await debugAlocacoesResponse.json();
      
      console.log('🧪 Resposta do debug de alocações:', debugAlocacoesData);
      
      setDebugInfo({
        especialidades: especialidadesData.data || [],
        alocacoes: alocacoesData.data || [],
        loading: false
      });
      
    } catch (error: any) {
      console.error('❌ Erro no teste:', error);
      setDebugInfo(prev => ({
        ...prev,
        error: error.message,
        loading: false
      }));
    }
  };

  const testDatabaseConnection = async () => {
    try {
      console.log('🧪 Testando conexão com o banco...');
      
      // Testar se as APIs estão respondendo
      const response = await fetch("/api/debug/especialidades");
      const data = await response.json();
      
      console.log('🧪 Teste de conexão:', data);
      
      if (data.success) {
        alert('✅ Conexão com o banco funcionando!');
      } else {
        alert('❌ Problema na conexão com o banco');
      }
      
    } catch (error) {
      console.error('❌ Erro no teste de conexão:', error);
      alert('❌ Erro ao testar conexão com o banco');
    }
  };

  useEffect(() => {
    // Executar teste automaticamente ao carregar a página
    testEspecialidades();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🧪 Teste de Especialidades</h1>
        <div className="space-x-2">
          <Button onClick={testEspecialidades} disabled={debugInfo.loading}>
            {debugInfo.loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Testando...
              </>
            ) : (
              '🔄 Executar Teste'
            )}
          </Button>
          <Button onClick={testDatabaseConnection} variant="outline">
            🗄️ Testar Conexão
          </Button>
        </div>
      </div>

      {debugInfo.error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <AlertCircle className="w-5 h-5 mr-2" />
              Erro no Teste
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{debugInfo.error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              Especialidades ({debugInfo.especialidades.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {debugInfo.especialidades.length > 0 ? (
              <div className="space-y-2">
                {debugInfo.especialidades.slice(0, 10).map((esp) => (
                  <div key={esp.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium">{esp.nome}</span>
                    <span className="text-sm text-gray-500">ID: {esp.id}</span>
                  </div>
                ))}
                {debugInfo.especialidades.length > 10 && (
                  <p className="text-sm text-gray-500 text-center">
                    ... e mais {debugInfo.especialidades.length - 10} especialidades
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center">Nenhuma especialidade encontrada</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
              Alocações ({debugInfo.alocacoes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {debugInfo.alocacoes.length > 0 ? (
              <div className="space-y-2">
                {debugInfo.alocacoes.slice(0, 10).map((aloc) => (
                  <div key={aloc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{aloc.especialidade?.nome || 'N/A'}</span>
                      <br />
                      <span className="text-sm text-gray-500">
                        {aloc.unidade?.nome} - {aloc.prestador?.nome}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">ID: {aloc.id}</span>
                  </div>
                ))}
                {debugInfo.alocacoes.length > 10 && (
                  <p className="text-sm text-gray-500 text-center">
                    ... e mais {debugInfo.alocacoes.length - 10} alocações
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center">Nenhuma alocação encontrada</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>📋 Logs do Console</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Abra o console do navegador (F12) para ver os logs detalhados dos testes.
            Os logs mostrarão informações sobre cada etapa do processo de carregamento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

