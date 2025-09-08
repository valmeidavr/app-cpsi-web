import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";
import { updatePlanosSchema } from "../schema/formSchemaPlanos";
import { z } from "zod";
import { PlanoConta } from "@/app/types/PlanoConta";

// GET - Buscar plano de contas por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [rows] = await accessPool.execute(
      'SELECT * FROM plano_contas WHERE id = ?',
      [id]
    );

    if ((rows as PlanoConta[]).length === 0) {
      return NextResponse.json(
        { error: 'Plano de contas não encontrado' },
        { status: 404 }
      );
    }

    const planoConta = (rows as PlanoConta[])[0];

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
    const validatedData = updatePlanosSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    const { ...payload } = validatedData.data;

    // Atualizar plano de contas
    await accessPool.execute(
      `UPDATE plano_contas SET 
        nome = ?, categoria = ?, descricao = ?
       WHERE id = ?`,
      [payload.nome, payload.categoria, payload.descricao, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar plano de contas:', error);
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

// DELETE - Deletar plano de contas
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Soft delete - marcar como inativo
    await accessPool.execute(
      'UPDATE plano_contas SET status = "Inativo" WHERE id = ?',
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar plano de contas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}