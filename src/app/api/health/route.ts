import { NextRequest, NextResponse } from 'next/server';
import { healthCheck, getPoolStats, testConnection } from '@/lib/mysql';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const detailed = searchParams.get('detailed') === 'true';
  
  try {
    const [dbHealth, poolStats] = await Promise.all([
      healthCheck(),
      detailed ? getPoolStats() : null
    ]);
    
    const response = {
      timestamp: new Date().toISOString(),
      service: 'prevSaude API',
      database: dbHealth,
      ...(poolStats && { poolStats })
    };
    
    // Se o banco está unhealthy, retorna status 503
    if (dbHealth.status === 'unhealthy') {
      return NextResponse.json(response, { status: 503 });
    }
    
    return NextResponse.json(response, { status: 200 });
    
  } catch (error) {
    const errorResponse = {
      timestamp: new Date().toISOString(),
      service: 'prevSaude API',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      database: { status: 'unreachable' }
    };
    
    return NextResponse.json(errorResponse, { status: 503 });
  }
}

// Endpoint para forçar teste de conexão
export async function POST(request: NextRequest) {
  try {
    console.log('🔧 [Health] Executando teste forçado de conexão...');
    
    const connectionTest = await testConnection();
    
    const response = {
      timestamp: new Date().toISOString(),
      action: 'connection_test',
      result: connectionTest ? 'success' : 'failed',
      message: connectionTest ? 'Conexão testada com sucesso' : 'Falha no teste de conexão'
    };
    
    return NextResponse.json(response, { 
      status: connectionTest ? 200 : 503 
    });
    
  } catch (error) {
    const errorResponse = {
      timestamp: new Date().toISOString(),
      action: 'connection_test',
      result: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}