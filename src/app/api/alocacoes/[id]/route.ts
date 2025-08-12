import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";

// GET - Buscar alocacao por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const [rows] = await gestorPool.execute(
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
    await gestorPool.execute(
      `UPDATE alocacoes SET 
        especialidades_id = ?, unidades_id = ?, prestadores_id = ?
       WHERE id = ?`,
      [body.especialidades_id, body.unidades_id, body.prestadores_id, id]
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