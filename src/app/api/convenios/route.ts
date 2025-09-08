import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";
import { z } from "zod";
import { createConvenioSchema, updateConvenioSchema } from "./schema/formSchemaConvenios";

export type CreateConvenioDTO = z.infer<typeof createConvenioSchema>;
export type UpdateConvenioDTO = z.infer<typeof updateConvenioSchema>;

// GET - Listar convênios com paginação e busca
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';

    let query = 'SELECT id, nome, desconto, regras, tabelaFaturamentosId as tabela_faturamento_id FROM convenios';
    const params: (string | number)[] = [];

    if (search) {
      query += ' WHERE (nome LIKE ? OR regras LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Adicionar paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY nome ASC LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const [convenioRows] = await accessPool.execute(query, params);

    // Buscar total de registros para paginação
    let countQuery = 'SELECT COUNT(*) as total FROM convenios';
    const countParams: (string)[] = [];

    if (search) {
      countQuery += ' WHERE (nome LIKE ? OR regras LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countRows] = await accessPool.execute(countQuery, countParams);
    const total = (countRows as Array<{ total: number }>)[0]?.total || 0;

    return NextResponse.json({
      data: convenioRows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar convênios:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar convênio
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createConvenioSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    const { ...payload } = validatedData.data;

    // Garantir que desconto seja um número válido
    const desconto = payload.desconto !== undefined ? Number(payload.desconto) : 0;

    // Inserir convênio
    const [result] = await accessPool.execute(
      `INSERT INTO convenios (
        nome, desconto, regras, tabelaFaturamentosId
      ) VALUES (?, ?, ?, ?)`,
      [
        payload.nome, desconto, payload.regras, payload.tabelaFaturamentosId
      ]
    );

    return NextResponse.json({ 
      success: true, 
      id: (result as { insertId: number }).insertId 
    });
  } catch (error) {
    console.error('❌ Erro ao criar convênio:', error);
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

// PUT - Atualizar convênio
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do convênio é obrigatório' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateConvenioSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    const { ...payload } = validatedData.data;

    // Garantir que desconto seja um número válido
    const desconto = payload.desconto !== undefined ? Number(payload.desconto) : 0;

    // Atualizar convênio
    await accessPool.execute(
      `UPDATE convenios SET 
        nome = ?, desconto = ?, regras = ?, tabelaFaturamentosId = ?
       WHERE id = ?`,
      [
        payload.nome, desconto, payload.regras, payload.tabelaFaturamentosId, id
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar convênio:', error);
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

// DELETE - Deletar convênio
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do convênio é obrigatório' },
        { status: 400 }
      );
    }

    // Soft delete - marcar como inativo
    await accessPool.execute(
      'UPDATE convenios SET status = "Inativo" WHERE id = ?',
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar convênio:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}