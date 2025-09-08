import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";

// GET - Buscar valor de procedimento por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [rows] = await accessPool.execute(
      'SELECT * FROM valor_procedimentos WHERE id = ?',
      [id]
    );

    if ((rows as Array<{
      id: number;
      valor: number;
      tipo: string;
      tabela_faturamento_id: number;
      procedimento_id: number;
      createdAt: Date;
      updatedAt: Date;
    }>).length === 0) {
      return NextResponse.json(
        { error: 'Valor de procedimento não encontrado' },
        { status: 404 }
      );
    }

    const valorProcedimento = (rows as Array<{
      id: number;
      valor: number;
      tipo: string;
      tabela_faturamento_id: number;
      procedimento_id: number;
      createdAt: Date;
      updatedAt: Date;
    }>)[0];

    return NextResponse.json(valorProcedimento);
  } catch (error) {
    console.error('Erro ao buscar valor de procedimento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar valor de procedimento
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Atualizar valor de procedimento
    await accessPool.execute(
      `UPDATE valor_procedimentos SET 
        valor = ?, tipo = ?, tabela_faturamento_id = ?, procedimento_id = ?
       WHERE id = ?`,
      [body.valor, body.tipo, body.tabela_faturamento_id, body.procedimento_id, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar valor de procedimento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 