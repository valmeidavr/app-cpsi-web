import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";
import { z } from "zod";
import { createTabelaFaturamentoSchema, updateTabelaFaturamentoSchema } from "./schema/formSchemaEspecialidade";
export type CreateTabelaFaturamentoDTO = z.infer<typeof createTabelaFaturamentoSchema>;
export type UpdateTabelaFaturamentoDTO = z.infer<typeof updateTabelaFaturamentoSchema>;
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';
    let query = 'SELECT * FROM tabela_faturamentos';
    const params: (string | number)[] = [];
    if (search) {
      query += ' WHERE (nome LIKE ? OR descricao LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY nome ASC LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    const [tabelaRows] = await accessPool.execute(query, params);
    let countQuery = 'SELECT COUNT(*) as total FROM tabela_faturamentos';
    const countParams: (string)[] = [];
    if (search) {
      countQuery += ' WHERE (nome LIKE ? OR descricao LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }
    const [countRows] = await accessPool.execute(countQuery, countParams);
    const total = (countRows as Array<{ total: number }>)[0]?.total || 0;
    return NextResponse.json({
      data: tabelaRows,
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
    const validatedData = createTabelaFaturamentoSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }
    const { ...payload } = validatedData.data;
    const [result] = await accessPool.execute(
      `INSERT INTO tabela_faturamentos (
        nome
      ) VALUES (?)`,
      [
        payload.nome,
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