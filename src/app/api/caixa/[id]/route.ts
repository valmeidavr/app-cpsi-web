import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";

// GET - Buscar caixa por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [rows] = await gestorPool.execute(
      'SELECT * FROM caixas WHERE id = ?',
      [id]
    );

    if ((rows as Array<{
      id: number;
      nome: string;
      tipo: string;
      saldo: number;
      status: string;
      createdAt: Date;
      updatedAt: Date;
    }>).length === 0) {
      return NextResponse.json(
        { error: 'Caixa não encontrado' },
        { status: 404 }
      );
    }

    const caixa = (rows as Array<{
      id: number;
      nome: string;
      tipo: string;
      saldo: number;
      status: string;
      createdAt: Date;
      updatedAt: Date;
    }>)[0];

    return NextResponse.json(caixa);
  } catch (error) {
    console.error('Erro ao buscar caixa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar caixa
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Atualizar caixa
    await gestorPool.execute(
      `UPDATE caixas SET 
        nome = ?, tipo = ?, saldo = ?
       WHERE id = ?`,
      [body.nome, body.tipo, body.saldo, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar caixa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 