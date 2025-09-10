import { NextRequest, NextResponse } from "next/server";
import { accessPool, executeWithRetry } from "@/lib/mysql";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// GET - Buscar grupo por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🔍 [GRUPOS GET BY ID] Buscando grupo ID:', id);

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'ID do grupo inválido' },
        { status: 400 }
      );
    }

    const grupo = await executeWithRetry(accessPool,
      'SELECT id, nome, descricao, status, created_at, updated_at FROM grupos WHERE id = ? AND status = "Ativo"',
      [id]
    );

    if ((grupo as Array<any>).length === 0) {
      return NextResponse.json(
        { error: 'Grupo não encontrado' },
        { status: 404 }
      );
    }

    console.log('✅ [GRUPOS GET BY ID] Grupo encontrado:', (grupo as Array<any>)[0].nome);
    return NextResponse.json((grupo as Array<any>)[0]);
  } catch (error) {
    console.error('❌ [GRUPOS GET BY ID] Erro ao buscar grupo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar grupo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('📝 [GRUPOS PUT] Atualizando grupo ID:', id);
    
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'ID do grupo inválido' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log('📋 [GRUPOS PUT] Dados recebidos:', body);

    // Validar dados obrigatórios
    if (!body.nome || !body.nome.trim()) {
      return NextResponse.json(
        { error: 'Nome do grupo é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o grupo existe
    const grupoExistente = await executeWithRetry(accessPool,
      'SELECT id FROM grupos WHERE id = ? AND status = "Ativo"',
      [id]
    );

    if ((grupoExistente as Array<any>).length === 0) {
      return NextResponse.json(
        { error: 'Grupo não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se já existe outro grupo com o mesmo nome
    const nomeExistente = await executeWithRetry(accessPool,
      'SELECT id FROM grupos WHERE nome = ? AND id != ? AND status = "Ativo"',
      [body.nome.trim(), id]
    );

    if ((nomeExistente as Array<any>).length > 0) {
      return NextResponse.json(
        { error: 'Já existe um grupo com este nome' },
        { status: 400 }
      );
    }

    // Atualizar o grupo
    await executeWithRetry(accessPool,
      'UPDATE grupos SET nome = ?, descricao = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [body.nome.trim(), body.descricao?.trim() || null, id]
    );

    console.log('✅ [GRUPOS PUT] Grupo atualizado com sucesso');

    // Buscar o grupo atualizado para retornar
    const grupoAtualizado = await executeWithRetry(accessPool,
      'SELECT id, nome, descricao, status, created_at, updated_at FROM grupos WHERE id = ?',
      [id]
    );

    return NextResponse.json((grupoAtualizado as Array<any>)[0]);
  } catch (error) {
    console.error('❌ [GRUPOS PUT] Erro ao atualizar grupo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir grupo (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🗑️ [GRUPOS DELETE] Excluindo grupo ID:', id);
    
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: 'ID do grupo inválido' },
        { status: 400 }
      );
    }

    // Verificar se o grupo existe
    const grupoExistente = await executeWithRetry(accessPool,
      'SELECT id, nome FROM grupos WHERE id = ? AND status = "Ativo"',
      [id]
    );

    if ((grupoExistente as Array<any>).length === 0) {
      return NextResponse.json(
        { error: 'Grupo não encontrado' },
        { status: 404 }
      );
    }

    const grupo = (grupoExistente as Array<any>)[0];

    // Verificar se há usuários associados ao grupo
    try {
      const usuariosAssociados = await executeWithRetry(accessPool,
        'SELECT COUNT(*) as total FROM usuario_grupo WHERE grupo_id = ?',
        [id]
      );

      const totalUsuarios = (usuariosAssociados as Array<{total: number}>)[0].total;
      if (totalUsuarios > 0) {
        return NextResponse.json(
          { error: `Não é possível excluir o grupo "${grupo.nome}" pois existem ${totalUsuarios} usuários associados a ele` },
          { status: 400 }
        );
      }
    } catch (error) {
      // Se a tabela usuario_grupo não existir, continuar com a exclusão
      console.log('⚠️ [GRUPOS DELETE] Tabela usuario_grupo não encontrada, continuando exclusão');
    }

    // Fazer soft delete - marcar como inativo
    await executeWithRetry(accessPool,
      'UPDATE grupos SET status = "Inativo", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    console.log('✅ [GRUPOS DELETE] Grupo marcado como inativo:', grupo.nome);

    return NextResponse.json({ 
      success: true, 
      message: `Grupo "${grupo.nome}" excluído com sucesso` 
    });
  } catch (error) {
    console.error('❌ [GRUPOS DELETE] Erro ao excluir grupo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}