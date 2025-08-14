import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";

// GET - Buscar plano de contas por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [rows] = await gestorPool.execute(
      'SELECT * FROM plano_contas WHERE id = ?',
      [id]
    );

    if ((rows as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Plano de contas não encontrado' },
        { status: 404 }
      );
    }

    const planoConta = (rows as any[])[0];

    return NextResponse.json(planoConta);
  } catch (error) {
    console.error('Erro ao buscar plano de contas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar plano de contas
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Atualizar plano de contas
    await gestorPool.execute(
      `UPDATE plano_contas SET 
        nome = ?, categoria = ?, descricao = ?
       WHERE id = ?`,
      [body.nome, body.categoria, body.descricao, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar plano de contas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 