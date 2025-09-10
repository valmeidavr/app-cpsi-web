import { NextRequest, NextResponse } from "next/server";
import { accessPool, executeWithRetry } from "@/lib/mysql";

// GET - Contar usuários de um grupo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('👥 [GRUPOS USUARIOS] Contando usuários do grupo ID:', id);

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

    try {
      // Contar usuários na tabela usuario_grupo
      const usuariosCount = await executeWithRetry(accessPool,
        'SELECT COUNT(*) as total FROM usuario_grupo WHERE grupo_id = ?',
        [id]
      );

      const total = (usuariosCount as Array<{total: number}>)[0].total;
      console.log('📊 [GRUPOS USUARIOS] Grupo tem', total, 'usuários');

      return NextResponse.json({ total });
    } catch (tableError) {
      // Se a tabela usuario_grupo não existir, retornar 0
      console.log('⚠️ [GRUPOS USUARIOS] Tabela usuario_grupo não encontrada, retornando 0');
      return NextResponse.json({ total: 0 });
    }
  } catch (error) {
    console.error('❌ [GRUPOS USUARIOS] Erro ao contar usuários:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}