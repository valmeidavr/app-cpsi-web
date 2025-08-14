import { NextRequest, NextResponse } from "next/server";
import { gestorPool, accessPool } from "@/lib/mysql";

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Teste - Verificando estrutura das tabelas...');
    
    // Verificar estrutura da tabela lancamentos no banco gestor
    try {
      const [lancamentosStructure] = await gestorPool.execute('DESCRIBE lancamentos');
      console.log('🔍 Teste - Estrutura da tabela lancamentos:', lancamentosStructure);
    } catch (error) {
      console.error('🔍 Teste - Erro ao verificar lancamentos:', error);
    }

    // Verificar estrutura da tabela usuarios no banco cpsi_acesso
    try {
      const [usuariosStructure] = await accessPool.execute('DESCRIBE usuarios');
      console.log('🔍 Teste - Estrutura da tabela usuarios:', usuariosStructure);
    } catch (error) {
      console.error('🔍 Teste - Erro ao verificar usuarios:', error);
    }

    // Verificar foreign keys da tabela lancamentos
    try {
      const [foreignKeys] = await gestorPool.execute(`
        SELECT 
          CONSTRAINT_NAME,
          COLUMN_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = 'gestor' 
        AND TABLE_NAME = 'lancamentos'
        AND REFERENCED_TABLE_NAME IS NOT NULL
      `);
      console.log('🔍 Teste - Foreign Keys da tabela lancamentos:', foreignKeys);
    } catch (error) {
      console.error('🔍 Teste - Erro ao verificar foreign keys:', error);
    }

    // Verificar dados de exemplo
    try {
      const [lancamentosSample] = await gestorPool.execute('SELECT * FROM lancamentos LIMIT 3');
      console.log('🔍 Teste - Amostra de lançamentos:', lancamentosSample);
    } catch (error) {
      console.error('🔍 Teste - Erro ao buscar lançamentos:', error);
    }

    try {
      const [usuariosSample] = await accessPool.execute('SELECT * FROM usuarios LIMIT 3');
      console.log('🔍 Teste - Amostra de usuários:', usuariosSample);
    } catch (error) {
      console.error('🔍 Teste - Erro ao buscar usuários:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Estrutura das tabelas verificada. Verifique os logs do console.'
    });
  } catch (error) {
    console.error('🔍 Teste - Erro geral:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
