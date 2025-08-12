import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";

// GET - Buscar agenda por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const [rows] = await gestorPool.execute(
      'SELECT * FROM agendas WHERE id = ?',
      [id]
    );

    if ((rows as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Agenda não encontrada' },
        { status: 404 }
      );
    }

    const agenda = (rows as any[])[0];

    return NextResponse.json(agenda);
  } catch (error) {
    console.error('Erro ao buscar agenda:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar agenda
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();

    // Atualizar agenda
    await gestorPool.execute(
      `UPDATE agendas SET 
        dtagenda = ?, situacao = ?, clientes_id = ?, convenios_id = ?, 
        procedimentos_id = ?, expedientes_id = ?, prestadores_id = ?, 
        unidades_id = ?, especialidades_id = ?, horario = ?, tipo = ?
       WHERE id = ?`,
      [
        body.dtagenda, body.situacao, body.clientes_id, body.convenios_id,
        body.procedimentos_id, body.expedientes_id, body.prestadores_id,
        body.unidades_id, body.especialidades_id, body.horario, body.tipo, id
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar agenda:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 