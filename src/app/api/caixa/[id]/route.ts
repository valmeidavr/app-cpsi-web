import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";
import { updateCaixaSchema } from "../schema/formSchemaCaixa";
import { z } from "zod";
import { Caixa } from "@/app/types/Caixa";

// GET - Buscar caixa por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [rows] = await accessPool.execute(
      'SELECT * FROM caixas WHERE id = ?',
      [id]
    );

    if ((rows as Caixa[]).length === 0) {
      return NextResponse.json(
        { error: 'Caixa não encontrado' },
        { status: 404 }
      );
    }

    const caixa = (rows as Caixa[])[0];

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
    const validatedData = updateCaixaSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    const { ...payload } = validatedData.data;

    // Atualizar caixa
    await accessPool.execute(
      `UPDATE caixas SET 
        nome = ?, tipo = ?, saldo = ?
       WHERE id = ?`,
      [payload.nome, payload.tipo, payload.saldo, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar caixa:', error);
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

// DELETE - Deletar caixa
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Soft delete - marcar como inativo
    await accessPool.execute(
      'UPDATE caixas SET status = "Inativo" WHERE id = ?',
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar caixa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}