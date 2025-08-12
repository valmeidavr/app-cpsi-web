import { NextRequest, NextResponse } from "next/server";
import { gestorPool, executeWithRetry } from "@/lib/mysql";

// GET - Buscar agenda por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const rows = await executeWithRetry(gestorPool,
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

// PATCH - Atualizar situação da agenda
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();

    // Atualizar apenas a situação da agenda
    await executeWithRetry(gestorPool,
      `UPDATE agendas SET situacao = ? WHERE id = ?`,
      [body.situacao, id]
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

// PUT - Atualizar agenda completa
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();

    // Atualizar agenda com campos corretos
    await executeWithRetry(gestorPool,
      `UPDATE agendas SET 
        dtagenda = ?, situacao = ?, cliente_id = ?, convenio_id = ?, 
        procedimento_id = ?, expediente_id = ?, prestador_id = ?, 
        unidade_id = ?, especialidade_id = ?, tipo = ?
       WHERE id = ?`,
      [
        body.dtagenda, body.situacao, body.cliente_id, body.convenio_id,
        body.procedimento_id, body.expediente_id, body.prestador_id,
        body.unidade_id, body.especialidade_id, body.tipo, id
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