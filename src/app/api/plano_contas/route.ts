import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";
import { z } from "zod";
import { createPlanosSchema, updatePlanosSchema } from "./schema/formSchemaPlanos";
export type CreatePlanoContaDTO = z.infer<typeof createPlanosSchema>;
export type UpdatePlanoContaDTO = z.infer<typeof updatePlanosSchema>;
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';
    let query = 'SELECT * FROM plano_contas WHERE 1=1';
    const params: (string | number)[] = [];
    if (search) {
      query += ' AND (nome LIKE ? OR categoria LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY status DESC, nome ASC LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    const [planoRows] = await accessPool.execute(query, params);
    let countQuery = 'SELECT COUNT(*) as total FROM plano_contas WHERE 1=1';
    const countParams: (string)[] = [];
    if (search) {
      countQuery += ' AND (nome LIKE ? OR categoria LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }
    const [countRows] = await accessPool.execute(countQuery, countParams);
    const total = (countRows as Array<{ total: number }>)[0]?.total || 0;
    return NextResponse.json({
      data: planoRows,
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
    const validatedData = createPlanosSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }
    const { ...payload } = validatedData.data;
    const [result] = await accessPool.execute(
      `INSERT INTO plano_contas (
        nome, tipo, categoria, descricao
      ) VALUES (?, ?, ?, ?)`,
      [
        payload.nome, payload.tipo, payload.categoria, payload.descricao
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