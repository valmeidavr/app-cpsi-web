import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug - Iniciando teste da API de convênios-clientes...');
    
    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get("clienteId");
    
    console.log('🔍 Cliente ID solicitado:', clienteId);
    
    // Verificar se a tabela existe
    const [tables] = await accessPool.execute(
      "SHOW TABLES LIKE 'convenios_clientes'"
    );
    console.log('🔍 Tabela convenios_clientes existe:', (tables as Array<{ Tables_in_gestor: string }>).length > 0);
    
    if ((tables as Array<{ Tables_in_gestor: string }>).length === 0) {
      return NextResponse.json({
        error: 'Tabela convenios_clientes não encontrada',
        tables: await accessPool.execute("SHOW TABLES")
      }, { status: 404 });
    }
    
    // Verificar estrutura da tabela
    const [columns] = await accessPool.execute(
      "DESCRIBE convenios_clientes"
    );
    console.log('🔍 Estrutura da tabela convenios_clientes:', columns);
    
    // Verificar se há dados
    const [countResult] = await accessPool.execute(
      "SELECT COUNT(*) as total FROM convenios_clientes"
    );
    const total = (countResult as Array<{ total: number }>)[0]?.total || 0;
    console.log('🔍 Total de registros em convenios_clientes:', total);
    
    // Se foi solicitado um cliente específico, buscar seus convênios
    if (clienteId) {
      console.log('🔍 Buscando convênios para cliente ID:', clienteId);
      
      const [clienteConvenios] = await accessPool.execute(
        `SELECT cc.*, c.nome as convenio_nome 
         FROM convenios_clientes cc
         INNER JOIN convenios c ON cc.convenio_id = c.id
         WHERE cc.cliente_id = ?`,
        [clienteId]
      );
      
      console.log('🔍 Convênios do cliente encontrados:', clienteConvenios);
      
      return NextResponse.json({
        success: true,
        debug: {
          tabelaExiste: true,
          estrutura: columns,
          totalRegistros: total,
          clienteId: clienteId,
          conveniosDoCliente: clienteConvenios,
          amostra: (clienteConvenios as Array<{
            id: number;
            cliente_id: number;
            convenio_id: number;
            convenio_nome: string;
          }>).slice(0, 5)
        }
      });
    }
    
    // Buscar amostra de todos os registros
    const [amostra] = await accessPool.execute(
      `SELECT cc.*, c.nome as convenio_nome, cl.nome as cliente_nome
       FROM convenios_clientes cc
       INNER JOIN convenios c ON cc.convenio_id = c.id
       INNER JOIN clientes cl ON cc.cliente_id = cl.id
       LIMIT 10`
    );
    
    return NextResponse.json({
      success: true,
      debug: {
        tabelaExiste: true,
        estrutura: columns,
        totalRegistros: total,
        amostra: amostra
      }
    });
    
  } catch (error: unknown) {
    console.error('❌ Erro no debug de convênios-clientes:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: errorMessage,
      stack: errorStack
    }, { status: 500 });
  }
}
