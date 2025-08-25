import { NextRequest, NextResponse } from "next/server";
import { gestorPool, executeWithRetry } from "@/lib/mysql";

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug - Iniciando teste da API de alocações...');
    
    // Testar conexão com o banco
    console.log('🔍 Testando conexão com o banco...');
    
    // Verificar se a tabela existe
    const [tables] = await gestorPool.execute(
      "SHOW TABLES LIKE 'alocacoes'"
    );
    console.log('🔍 Tabela alocacoes existe:', (tables as any[]).length > 0);
    
    if ((tables as any[]).length === 0) {
      return NextResponse.json({
        error: 'Tabela alocacoes não encontrada',
        tables: await gestorPool.execute("SHOW TABLES")
      }, { status: 404 });
    }
    
    // Verificar estrutura da tabela
    const [columns] = await gestorPool.execute(
      "DESCRIBE alocacoes"
    );
    console.log('🔍 Estrutura da tabela alocacoes:', columns);
    
    // Verificar se há dados
    const [countResult] = await gestorPool.execute(
      "SELECT COUNT(*) as total FROM alocacoes"
    );
    const total = (countResult as any[])[0]?.total || 0;
    console.log('🔍 Total de alocações:', total);
    
    // Tentar buscar alocações com JOIN
    const [alocacoes] = await gestorPool.execute(`
      SELECT 
        a.*,
        e.id as especialidade_id,
        e.nome as especialidade_nome,
        u.id as unidade_id,
        u.nome as unidade_nome,
        p.id as prestador_id,
        p.nome as prestador_nome
      FROM alocacoes a
      LEFT JOIN especialidades e ON a.especialidade_id = e.id
      LEFT JOIN unidades u ON a.unidade_id = u.id
      LEFT JOIN prestadores p ON a.prestador_id = p.id
      LIMIT 5
    `);
    console.log('🔍 Alocações com JOIN encontradas:', (alocacoes as any[]).length);
    
    // Verificar se há problemas com as tabelas relacionadas
    const [especialidadesCount] = await gestorPool.execute(
      "SELECT COUNT(*) as total FROM especialidades"
    );
    const [unidadesCount] = await gestorPool.execute(
      "SELECT COUNT(*) as total FROM unidades"
    );
    const [prestadoresCount] = await gestorPool.execute(
      "SELECT COUNT(*) as total FROM prestadores"
    );
    
    return NextResponse.json({
      success: true,
      debug: {
        tabelaExiste: true,
        estrutura: columns,
        totalAlocacoes: total,
        totalEspecialidades: (especialidadesCount as any[])[0]?.total || 0,
        totalUnidades: (unidadesCount as any[])[0]?.total || 0,
        totalPrestadores: (prestadoresCount as any[])[0]?.total || 0,
        alocacoesComJoin: (alocacoes as any[]).length,
        amostra: (alocacoes as any[]).slice(0, 3) // Primeiras 3 alocações
      }
    });
    
  } catch (error: any) {
    console.error('❌ Erro no debug de alocações:', error);
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

