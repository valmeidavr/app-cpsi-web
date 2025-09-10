import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [rows] = await accessPool.execute(
      `SELECT 
        id, nome, horario as horario_inicio, 
        dataInicio as data_inicio, dataFim as data_fim, 
        limiteVagas as limite_vagas, 
        procedimento_id, prestador_id,
        createdAt, updatedAt
      FROM turmas WHERE id = ?`,
      [id]
    );
    if ((rows as Array<{
      id: number;
      nome: string;
      horario_inicio: string;
      data_inicio: string;
      data_fim: string;
      limite_vagas: number;
      prestador_id: number;
      procedimento_id: number;
      createdAt: Date;
      updatedAt: Date;
    }>).length === 0) {
      return NextResponse.json(
        { error: 'Turma não encontrada' },
        { status: 404 }
      );
    }
    const turma = (rows as Array<{
      id: number;
      nome: string;
      horario_inicio: string;
      data_inicio: string;
      data_fim: string;
      limite_vagas: number;
      prestador_id: number;
      procedimento_id: number;
      createdAt: Date;
      updatedAt: Date;
    }>)[0];
    return NextResponse.json(turma);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    console.log('📝 [TURMAS PUT] ID:', id);
    console.log('📝 [TURMAS PUT] Body:', body);
    // Corrigir os nomes dos campos para corresponder ao banco de dados
    await accessPool.execute(
      `UPDATE turmas SET 
        nome = ?, horario = ?, dataInicio = ?, 
        limiteVagas = ?, procedimento_id = ?, prestador_id = ?, 
        updatedAt = NOW()
       WHERE id = ?`,
      [
        body.nome, 
        body.horario_inicio, // será salvo como horario no banco
        body.data_inicio,    // será salvo como dataInicio no banco
        body.limite_vagas,   // será salvo como limiteVagas no banco
        body.procedimento_id, 
        body.prestador_id, 
        id
      ]
    );
    
    console.log('✅ [TURMAS PUT] Turma atualizada com sucesso');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ [TURMAS PUT] Erro ao atualizar turma:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Atualizar apenas a data de fim
    if (body.dataFim) {
      await accessPool.execute(
        'UPDATE turmas SET dataFim = ? WHERE id = ?',
        [body.dataFim, id]
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar turma:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Deletar todos os alunos da turma primeiro
    await accessPool.execute(
      'DELETE FROM alunos_turmas WHERE turma_id = ?',
      [id]
    );
    
    // Deletar a turma
    await accessPool.execute(
      'DELETE FROM turmas WHERE id = ?',
      [id]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar turma:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 