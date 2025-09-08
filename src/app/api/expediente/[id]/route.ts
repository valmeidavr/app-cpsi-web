import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";

// GET - Buscar expediente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [rows] = await accessPool.execute(
      'SELECT * FROM expediente WHERE id = ?',
      [id]
    );

    if ((rows as Array<{
      id: number;
      dt_inicio: string;
      dt_final: string;
      h_inicio: string;
      h_final: string;
      intervalo: number;
      semana: string;
      alocacoes_id: number;
      createdAt: Date;
      updatedAt: Date;
    }>).length === 0) {
      return NextResponse.json(
        { error: 'Expediente não encontrado' },
        { status: 404 }
      );
    }

    const expediente = (rows as Array<{
      id: number;
      dt_inicio: string;
      dt_final: string;
      h_inicio: string;
      h_final: string;
      intervalo: number;
      semana: string;
      alocacoes_id: number;
      createdAt: Date;
      updatedAt: Date;
    }>)[0];

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Atualizar expediente
    await accessPool.execute(
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