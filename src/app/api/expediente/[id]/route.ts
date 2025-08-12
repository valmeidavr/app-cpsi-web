import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";

// GET - Buscar expediente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const [rows] = await gestorPool.execute(
      'SELECT * FROM expediente WHERE id = ?',
      [id]
    );

    if ((rows as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Expediente não encontrado' },
        { status: 404 }
      );
    }

    const expediente = (rows as any[])[0];

    return NextResponse.json(expediente);
  } catch (error) {
    console.error('Erro ao buscar expediente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar expediente
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();

    // Atualizar expediente
    await gestorPool.execute(
      `UPDATE expediente SET 
        dt_inicio = ?, dt_final = ?, h_inicio = ?, h_final = ?, 
        intervalo = ?, semana = ?, alocacoes_id = ?
       WHERE id = ?`,
      [
        body.dt_inicio, body.dt_final, body.h_inicio, body.h_final,
        body.intervalo, body.semana, body.alocacoes_id, id
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar expediente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 