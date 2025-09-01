import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";

// GET - Buscar tabela de faturamento por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [rows] = await gestorPool.execute(
      'SELECT * FROM tabela_faturamentos WHERE id = ?',
      [id]
    );

    if ((rows as Array<{
      id: number;
      nome: string;
      descricao: string;
      createdAt: Date;
      updatedAt: Date;
    }>).length === 0) {
      return NextResponse.json(
        { error: 'Tabela de faturamento não encontrada' },
        { status: 404 }
      );
    }

    const tabelaFaturamento = (rows as Array<{
      id: number;
      nome: string;
      descricao: string;
      createdAt: Date;
      updatedAt: Date;
    }>)[0];

    return NextResponse.json(tabelaFaturamento);
  } catch (error) {
    console.error('Erro ao buscar tabela de faturamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar tabela de faturamento
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Atualizar tabela de faturamento
    await gestorPool.execute(
      `UPDATE tabela_faturamentos SET 
        nome = ?
       WHERE id = ?`,
      [body.nome, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar tabela de faturamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 