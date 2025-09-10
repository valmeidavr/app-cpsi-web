import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const deleteAll = searchParams.get('deleteAll') === 'true';
    
    if (deleteAll) {
      // Deletar todos os alunos da turma
      console.log('🗑️ Deletando todos os alunos da turma:', id);
      await accessPool.execute(
        'DELETE FROM alunos_turmas WHERE turma_id = ?',
        [id]
      );
    } else {
      // Deletar um aluno específico
      console.log('🗑️ Deletando aluno específico:', id);
      await accessPool.execute(
        'DELETE FROM alunos_turmas WHERE id = ?',
        [id]
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar aluno(s):', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const [rows] = await accessPool.execute(
      `SELECT 
        at.id,
        at.turma_id,
        at.cliente_id,
        at.data_inscricao,
        at.createdAt,
        at.updatedAt,
        JSON_OBJECT(
          'id', c.id,
          'nome', c.nome,
          'cpf', c.cpf,
          'telefone1', c.telefone1,
          'dtnascimento', c.dtnascimento,
          'status', c.status
        ) as cliente
      FROM alunos_turmas at
      LEFT JOIN clientes c ON at.cliente_id = c.id
      WHERE at.id = ?`,
      [id]
    );
    
    if ((rows as Array<any>).length === 0) {
      return NextResponse.json(
        { error: 'Aluno não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json((rows as Array<any>)[0]);
  } catch (error) {
    console.error('Erro ao buscar aluno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}