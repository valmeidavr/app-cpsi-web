import { NextRequest, NextResponse } from "next/server";
import { accessPool, executeWithRetry } from "@/lib/mysql";
import { updateAlocacaoSchema } from "../shema/formSchemaAlocacao";
import { z } from "zod";
import { Alocacao } from "@/app/types/Alocacao";

// GET - Buscar alocacao por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rows = await executeWithRetry(accessPool,
      'SELECT * FROM alocacoes WHERE id = ?',
      [id]
    );

    if ((rows as Alocacao[]).length === 0) {
      return NextResponse.json(
        { error: 'Alocação não encontrada' },
        { status: 404 }
      );
    }

    const alocacao = (rows as Alocacao[])[0];

    return NextResponse.json(alocacao);
  } catch (error) {
    console.error('Erro ao buscar alocacao:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar alocacao
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateAlocacaoSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    const { ...payload } = validatedData.data;

    // Atualizar alocacao
    await executeWithRetry(accessPool,
      `UPDATE alocacoes SET 
        unidade_id = ?, especialidade_id = ?, prestador_id = ?
       WHERE id = ?`,
      [payload.unidade_id, payload.especialidade_id, payload.prestador_id, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar alocacao:', error);
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

// DELETE - Excluir alocacao
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Excluir alocacao
    await executeWithRetry(accessPool,
      'DELETE FROM alocacoes WHERE id = ?',
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir alocacao:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}