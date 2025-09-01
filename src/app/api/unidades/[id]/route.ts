import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";

// GET - Buscar unidade por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [rows] = await gestorPool.execute(
      'SELECT * FROM unidades WHERE id = ?',
      [id]
    );

    if ((rows as Array<{
      id: number;
      nome: string;
      status: string;
      createdAt: Date;
      updatedAt: Date;
    }>).length === 0) {
      return NextResponse.json(
        { error: 'Unidade não encontrada' },
        { status: 404 }
      );
    }

    const unidade = (rows as Array<{
      id: number;
      nome: string;
      status: string;
      createdAt: Date;
      updatedAt: Date;
    }>)[0];

    return NextResponse.json(unidade);
  } catch (error) {
    console.error('Erro ao buscar unidade:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar unidade
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Atualizar unidade
    await gestorPool.execute(
      `UPDATE unidades SET 
        nome = ?
       WHERE id = ?`,
      [body.nome, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar unidade:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 