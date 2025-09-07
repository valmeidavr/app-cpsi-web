import { NextRequest, NextResponse } from "next/server";
import { gestorPool, executeWithRetry } from "@/lib/mysql";
import { z } from "zod";
import { createCaixaSchema, updateCaixaSchema } from "./schema/formSchemaCaixa";

export type CreateCaixaDTO = z.infer<typeof createCaixaSchema>;
export type UpdateCaixaDTO = z.infer<typeof updateCaixaSchema>;

// GET - Listar caixas com paginação e busca
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';

    let query = 'SELECT * FROM caixas WHERE 1=1';
    const params: (string | number)[] = [];

    if (search) {
      query += ' AND nome LIKE ?';
      params.push(`%${search}%`);
    }

    // Adicionar paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY nome ASC LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    // Parâmetros de paginação inseridos diretamente na query;

    const caixaRows = await executeWithRetry(gestorPool, query, params);

    // Buscar total de registros para paginação
    let countQuery = 'SELECT COUNT(*) as total FROM caixas WHERE 1=1';
    const countParams: (string)[] = [];

    if (search) {
      countQuery += ' AND nome LIKE ?';
      countParams.push(`%${search}%`);
    }

    const countRows = await executeWithRetry(gestorPool, countQuery, countParams);
    const total = (countRows as Array<{ total: number }>)[0]?.total || 0;

    return NextResponse.json({
      data: caixaRows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar caixas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar caixa
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createCaixaSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    const { ...payload } = validatedData.data;

    // Inserir caixa
    const result = await executeWithRetry(gestorPool,
      `INSERT INTO caixas (
        nome, tipo, saldo
      ) VALUES (?, ?, ?)`,
      [
        payload.nome, payload.tipo, payload.saldo
      ]
    );

    return NextResponse.json({ 
      success: true, 
      id: (result as { insertId: number }).insertId 
    });
  } catch (error) {
    console.error('Erro ao criar caixa:', error);
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