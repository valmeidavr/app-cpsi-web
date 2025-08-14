import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    
    console.log('🔍 Teste Busca - Parâmetro de busca:', search);
    
    // Testar busca simples
    let query = 'SELECT login, nome, email, status FROM usuarios WHERE status = "Ativo"';
    const params: (string | number)[] = [];
    
    if (search) {
      query += ' AND (nome LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY nome ASC LIMIT 10';
    
    console.log('🔍 Teste Busca - Query:', query);
    console.log('🔍 Teste Busca - Parâmetros:', params);
    
    const [rows] = await accessPool.execute(query, params);
    const usuarios = rows as any[];
    
    console.log('🔍 Teste Busca - Usuários encontrados:', usuarios.length);
    console.log('🔍 Teste Busca - Primeiros usuários:', usuarios.slice(0, 3));
    
    // Testar busca com LIKE específico
    if (search) {
      console.log('🔍 Teste Busca - Testando busca específica...');
      
      const [testRows] = await accessPool.execute(
        'SELECT COUNT(*) as total FROM usuarios WHERE nome LIKE ? AND status = "Ativo"',
        [`%${search}%`]
      );
      const total = (testRows as any[])[0]?.total || 0;
      console.log('🔍 Teste Busca - Total de usuários com nome contendo:', search, '=', total);
    }
    
    return NextResponse.json({
      success: true,
      search,
      query,
      params,
      usuarios,
      total: usuarios.length
    });
  } catch (error) {
    console.error('🔍 Teste Busca - Erro:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
