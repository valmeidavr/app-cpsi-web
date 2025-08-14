import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";

// GET - Buscar especialidade por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [rows] = await gestorPool.execute(
      'SELECT * FROM especialidades WHERE id = ? AND status = "Ativo"',
      [id]
    );

    if ((rows as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Especialidade não encontrada' },
        { status: 404 }
      );
    }

    const especialidade = (rows as any[])[0];

    return NextResponse.json(especialidade);
  } catch (error) {
    console.error('Erro ao buscar especialidade:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar especialidade
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Atualizar especialidade
    await gestorPool.execute(
      `UPDATE especialidades SET 
        nome = ?, codigo = ?
       WHERE id = ?`,
      [body.nome, body.codigo, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar especialidade:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 