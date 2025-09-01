import { NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";

export async function GET() {
  try {
    console.log('🔍 Debug - Iniciando teste da API de especialidades...');
    
    // Testar conexão com o banco
    console.log('🔍 Testando conexão com o banco...');
    
    // Verificar se a tabela existe
    const [tables] = await gestorPool.execute(
      "SHOW TABLES LIKE 'especialidades'"
    );
    console.log('🔍 Tabela especialidades existe:', (tables as Array<{ Tables_in_gestor: string }>).length > 0);
    
    if ((tables as Array<{ Tables_in_gestor: string }>).length === 0) {
      return NextResponse.json({
        error: 'Tabela especialidades não encontrada',
        tables: await gestorPool.execute("SHOW TABLES")
      }, { status: 404 });
    }
    
    // Verificar estrutura da tabela
    const [columns] = await gestorPool.execute(
      "DESCRIBE especialidades"
    );
    console.log('🔍 Estrutura da tabela:', columns);
    
    // Verificar se há dados
    const [countResult] = await gestorPool.execute(
      "SELECT COUNT(*) as total FROM especialidades"
    );
    const total = (countResult as Array<{ total: number }>)[0]?.total || 0;
    console.log('🔍 Total de especialidades:', total);
    
    // Tentar buscar especialidades ativas
    const [especialidades] = await gestorPool.execute(
      'SELECT * FROM especialidades WHERE status = "Ativo" ORDER BY nome ASC'
    );
    console.log('🔍 Especialidades ativas encontradas:', (especialidades as Array<{
      id: number;
      nome: string;
      codigo: string;
      status: string;
      createdAt: Date;
      updatedAt: Date;
    }>).length);
    
    // Verificar se há especialidades com status diferente
    const [statusCount] = await gestorPool.execute(
      'SELECT status, COUNT(*) as count FROM especialidades GROUP BY status'
    );
    console.log('🔍 Contagem por status:', statusCount);
    
    return NextResponse.json({
      success: true,
      debug: {
        tabelaExiste: true,
        estrutura: columns,
        totalRegistros: total,
        especialidadesAtivas: (especialidades as Array<{
          id: number;
          nome: string;
          codigo: string;
          status: string;
          createdAt: Date;
          updatedAt: Date;
        }>).length,
        contagemPorStatus: statusCount,
        amostra: (especialidades as Array<{
          id: number;
          nome: string;
          codigo: string;
          status: string;
          createdAt: Date;
          updatedAt: Date;
        }>).slice(0, 3) // Primeiras 3 especialidades
      }
    });
    
  } catch (error: unknown) {
    console.error('❌ Erro no debug de especialidades:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: errorMessage,
      stack: errorStack
    }, { status: 500 });
  }
}

