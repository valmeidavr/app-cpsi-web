import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";

// GET - Buscar turma por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [rows] = await gestorPool.execute(
      'SELECT * FROM turmas WHERE id = ?',
      [id]
    );

    if ((rows as Array<{
      id: number;
      nome: string;
      horario_inicio: string;
      horario_fim: string;
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
      horario_fim: string;
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
    console.error('Erro ao buscar turma:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar turma
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Atualizar turma
    await gestorPool.execute(
      `UPDATE turmas SET 
        nome = ?, horario_inicio = ?, horario_fim = ?, data_inicio = ?, 
        limite_vagas = ?, procedimento_id = ?, prestador_id = ?
       WHERE id = ?`,
      [
        body.nome, body.horario_inicio, body.horario_fim, body.data_inicio,
        body.limite_vagas, body.procedimento_id, body.prestador_id, id
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar turma:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 