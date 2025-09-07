import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";

// Buscar todos os grupos disponíveis
export async function GET() {
  try {
    // Verificar se a tabela usuariogrupo existe
    const [tableCheck] = await accessPool.execute(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'usuariogrupo'",
      ['prevsaude']
    );
    
    if ((tableCheck as Array<{ count: number }>)[0]?.count === 0) {
      // Se não existir, retornar grupos padrão
      return NextResponse.json([
        { id: 1, nome: 'Administrador' },
        { id: 2, nome: 'Gestor' },
        { id: 3, nome: 'Usuário' },
        { id: 4, nome: 'Operador' }
      ]);
    }

    // Buscar grupos da tabela usuariogrupo
    const [gruposRows] = await accessPool.execute(
      'SELECT DISTINCT grupo_id as id, CASE grupo_id WHEN 1 THEN "Administrador" WHEN 2 THEN "Gestor" WHEN 3 THEN "Usuário" WHEN 4 THEN "Operador" ELSE CONCAT("Grupo ", grupo_id) END as nome FROM usuariogrupo ORDER BY grupo_id'
    );

    return NextResponse.json(gruposRows);
  } catch (error) {
    console.error('Erro ao buscar grupos:', error);
    // Retornar grupos padrão em caso de erro
    return NextResponse.json([
      { id: 1, nome: 'Administrador' },
      { id: 2, nome: 'Gestor' },
      { id: 3, nome: 'Usuário' },
      { id: 4, nome: 'Operador' }
    ]);
  }
}

// Buscar grupos de um usuário específico
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    // Buscar todos os grupos disponíveis
    const [gruposRows] = await accessPool.execute(
      'SELECT DISTINCT grupo_id as id, CASE grupo_id WHEN 1 THEN "Administrador" WHEN 2 THEN "Gestor" WHEN 3 THEN "Usuário" WHEN 4 THEN "Operador" ELSE CONCAT("Grupo ", grupo_id) END as nome FROM usuariogrupo ORDER BY grupo_id'
    );

    // Buscar grupos do usuário
    const [usuarioGruposRows] = await accessPool.execute(
      'SELECT grupo_id FROM usuariogrupo WHERE usuario_login = ?',
      [userId]
    );

    const grupos = gruposRows as Array<{
      id: number;
      nome: string;
    }>;
    const usuarioGrupos = usuarioGruposRows as Array<{
      grupo_id: number;
    }>;

    // Criar mapa de grupos do usuário
    const userGroups = usuarioGrupos.map(ug => ug.grupo_id);

    return NextResponse.json({
      grupos,
      userGroups
    });

  } catch (error) {
    console.error('Erro ao buscar grupos do usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Atualizar grupos do usuário
export async function PUT(request: NextRequest) {
  try {
    const { userId, grupos } = await request.json();

    if (!userId || !grupos) {
      return NextResponse.json({ error: 'Dados obrigatórios não fornecidos' }, { status: 400 });
    }

    // Remover todos os grupos atuais do usuário
    await accessPool.execute(
      'DELETE FROM usuariogrupo WHERE usuario_login = ?',
      [userId]
    );

    // Inserir novos grupos
    for (const grupo of grupos) {
      if (grupo.hasAccess) {
        await accessPool.execute(
          'INSERT INTO usuariogrupo (usuario_login, grupo_id) VALUES (?, ?)',
          [userId, grupo.id]
        );
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erro ao atualizar grupos do usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 