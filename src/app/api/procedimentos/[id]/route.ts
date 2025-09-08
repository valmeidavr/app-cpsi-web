import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";

// GET - Buscar procedimento por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [rows] = await accessPool.execute(
      'SELECT * FROM procedimentos WHERE id = ? AND status = "Ativo"',
      [id]
    );

    if ((rows as Array<{
      id: number;
      nome: string;
      codigo: string;
      tipo: string;
      especialidade_id: number;
      status: string;
      createdAt: Date;
      updatedAt: Date;
    }>).length === 0) {
      return NextResponse.json(
        { error: 'Procedimento não encontrado' },
        { status: 404 }
      );
    }

    const procedimento = (rows as Array<{
      id: number;
      nome: string;
      codigo: string;
      tipo: string;
      especialidade_id: number;
      status: string;
      createdAt: Date;
      updatedAt: Date;
    }>)[0];

    return NextResponse.json(procedimento);
  } catch (error) {
    console.error('Erro ao buscar procedimento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar procedimento
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Atualizar procedimento
    await accessPool.execute(
      `UPDATE procedimentos SET 
        nome = ?, codigo = ?, tipo = ?, especialidade_id = ?
       WHERE id = ?`,
      [
        body.nome, body.codigo, body.tipo, body.especialidade_id, id
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar procedimento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 