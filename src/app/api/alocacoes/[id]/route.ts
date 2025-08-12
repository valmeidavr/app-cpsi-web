import { NextRequest, NextResponse } from "next/server";
import { gestorPool, executeWithRetry } from "@/lib/mysql";

// GET - Buscar alocacao por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const rows = await executeWithRetry(gestorPool,
      'SELECT * FROM alocacoes WHERE id = ?',
      [id]
    );

    if ((rows as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Alocação não encontrada' },
        { status: 404 }
      );
    }

    const alocacao = (rows as any[])[0];

    return NextResponse.json(alocacao);
  } catch (error) {
    console.error('Erro ao buscar alocacao:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar alocacao
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();

    // Atualizar alocacao
    await executeWithRetry(gestorPool,
      `UPDATE alocacoes SET 
        unidade_id = ?, especialidade_id = ?, prestador_id = ?
       WHERE id = ?`,
      [body.unidade_id, body.especialidade_id, body.prestador_id, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar alocacao:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir alocacao
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Excluir alocacao
    await executeWithRetry(gestorPool,
      'DELETE FROM alocacoes WHERE id = ?',
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir alocacao:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 