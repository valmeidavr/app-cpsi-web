import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";

// Buscar todos os sistemas
export async function GET() {
  try {
    const [sistemasRows] = await gestorPool.execute(
      'SELECT id, nome FROM sistemas ORDER BY nome'
    );

    return NextResponse.json(sistemasRows);
  } catch (error) {
    console.error('Erro ao buscar sistemas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Buscar acesso de um usuário específico
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }

    // Buscar todos os sistemas
    const [sistemasRows] = await gestorPool.execute(
      'SELECT id, nome FROM sistemas ORDER BY nome'
    );

    // Buscar acesso do usuário
    const [acessoRows] = await gestorPool.execute(
      `SELECT us.sistemas_id, us.nivel, s.nome as sistema_nome 
       FROM usuario_sistema us 
       INNER JOIN sistemas s ON us.sistemas_id = s.id 
       WHERE us.usuarios_login = ?`,
      [userId]
    );

    const sistemas = sistemasRows as Array<{
      id: number;
      nome: string;
    }>;
    const acessos = acessoRows as Array<{
      sistemas_id: number;
      nivel: string;
      sistema_nome: string;
    }>;

    // Criar mapa de acesso
    const accessMap = acessos.reduce((acc, acesso) => {
      acc[acesso.sistemas_id] = {
        nivel: acesso.nivel,
        sistema_nome: acesso.sistema_nome
      };
      return acc;
    }, {} as Record<number, {
      nivel: string;
      sistema_nome: string;
    }>);

    return NextResponse.json({
      sistemas,
      userAccess: accessMap
    });

  } catch (error) {
    console.error('Erro ao buscar acesso do usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Atualizar acesso do usuário
export async function PUT(request: NextRequest) {
  try {
    const { userId, sistemas } = await request.json();

    if (!userId || !sistemas) {
      return NextResponse.json({ error: 'Dados obrigatórios não fornecidos' }, { status: 400 });
    }

    // Remover todos os acessos atuais do usuário
    await gestorPool.execute(
      'DELETE FROM usuario_sistema WHERE usuarios_login = ?',
      [userId]
    );

    // Inserir novos acessos
    for (const sistema of sistemas) {
      if (sistema.hasAccess) {
        await gestorPool.execute(
          'INSERT INTO usuario_sistema (usuarios_login, sistemas_id, nivel) VALUES (?, ?, ?)',
          [userId, sistema.id, sistema.nivel || 'Usuario']
        );
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Erro ao atualizar acesso do usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 