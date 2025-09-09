import { NextRequest, NextResponse } from "next/server";
import { accessPool, executeWithRetry } from "@/lib/mysql";
import { z } from "zod";
import { createCaixaSchema, updateCaixaSchema } from "./schema/formSchemaCaixa";
export type CreateCaixaDTO = z.infer<typeof createCaixaSchema>;
export type UpdateCaixaDTO = z.infer<typeof updateCaixaSchema>;
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
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY nome ASC LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    const caixaRows = await executeWithRetry(accessPool, query, params);
    let countQuery = 'SELECT COUNT(*) as total FROM caixas WHERE 1=1';
    const countParams: (string)[] = [];
    if (search) {
      countQuery += ' AND nome LIKE ?';
      countParams.push(`%${search}%`);
    }
    const countRows = await executeWithRetry(accessPool, countQuery, countParams);
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
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
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
    const result = await executeWithRetry(accessPool,
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