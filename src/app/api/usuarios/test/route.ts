import { NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";

export async function GET() {
  try {
    console.log('🔍 Teste - Verificando conexão com banco de usuários...');
    
    // Testar conexão simples
    const [testRows] = await gestorPool.execute('SELECT 1 as test');
    console.log('🔍 Teste - Conexão OK:', testRows);
    
    // Verificar estrutura da tabela
    const [structureRows] = await gestorPool.execute('DESCRIBE usuarios');
    console.log('🔍 Teste - Estrutura da tabela usuarios:', structureRows);
    
    // Tentar buscar usuários
    const [userRows] = await gestorPool.execute('SELECT * FROM usuarios LIMIT 5');
    console.log('🔍 Teste - Usuários encontrados:', userRows);
    
    return NextResponse.json({
      success: true,
      connection: 'OK',
      structure: structureRows,
      sampleUsers: userRows
    });
  } catch (error) {
    console.error('🔍 Teste - Erro:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
