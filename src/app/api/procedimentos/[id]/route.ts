import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";

// GET - Buscar procedimento por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const [rows] = await gestorPool.execute(
      'SELECT * FROM procedimentos WHERE id = ? AND status = "Ativo"',
      [id]
    );

    if ((rows as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Procedimento não encontrado' },
        { status: 404 }
      );
    }

    const procedimento = (rows as any[])[0];

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
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();

    // Atualizar procedimento
    await gestorPool.execute(
      `UPDATE procedimentos SET 
        nome = ?, codigo = ?, tipo = ?, especialidades_id = ?
       WHERE id = ?`,
      [
        body.nome, body.codigo, body.tipo, body.especialidades_id, id
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

// PATCH - Alterar status do procedimento
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();

    if (!body.status) {
      return NextResponse.json(
        { error: 'Status é obrigatório' },
        { status: 400 }
      );
    }

    // Atualizar status do procedimento
    await gestorPool.execute(
      'UPDATE procedimentos SET status = ? WHERE id = ?',
      [body.status, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao alterar status do procedimento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 