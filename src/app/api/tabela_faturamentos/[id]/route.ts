import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";
import { updateTabelaFaturamentoSchema } from "../schema/formSchemaEspecialidade";
import { z } from "zod";
import { TabelaFaturamento } from "@/app/types/TabelaFaturamento";

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

    if ((rows as TabelaFaturamento[]).length === 0) {
      return NextResponse.json(
        { error: 'Tabela de faturamento não encontrada' },
        { status: 404 }
      );
    }

    const tabelaFaturamento = (rows as TabelaFaturamento[])[0];

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
    const validatedData = updateTabelaFaturamentoSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    const { ...payload } = validatedData.data;

    // Atualizar tabela de faturamento
    await gestorPool.execute(
      `UPDATE tabela_faturamentos SET 
        nome = ?
       WHERE id = ?`,
      [payload.nome, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar tabela de faturamento:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar tabela de faturamento
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Soft delete - marcar como inativo
    await gestorPool.execute(
      'UPDATE tabela_faturamentos SET status = "Inativo" WHERE id = ?',
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar tabela de faturamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}