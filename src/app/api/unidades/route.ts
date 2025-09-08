import { NextRequest, NextResponse } from "next/server";
import { accessPool, executeWithRetry } from "@/lib/mysql";
import { z } from "zod";
import { createUnidadeSchema, updateUnidadeSchema } from "./schema/formSchemaUnidades";
export type CreateUnidadeDTO = z.infer<typeof createUnidadeSchema>;
export type UpdateUnidadeDTO = z.infer<typeof updateUnidadeSchema>;
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';
    const all = searchParams.get('all') || '';
    if (all === 'true' || limit === '1000') {
      const [rows] = await accessPool.execute(
        'SELECT * FROM unidades ORDER BY nome ASC'
      );
      console.log('🔍 Debug - Unidades encontradas:', (rows as Array<{
        id: number;
        nome: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
      }>).length);
      return NextResponse.json({
        data: rows,
        pagination: {
          page: 1,
          limit: (rows as Array<{
            id: number;
            nome: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
          }>).length,
          total: (rows as Array<{
            id: number;
            nome: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
          }>).length,
          totalPages: 1
        }
      });
    }
    let whereClause = '';
    const queryParams: (string | number)[] = [];
    if (search) {
      whereClause = ' WHERE nome LIKE ?';
      queryParams.push(`%${search}%`);
    }
    const countQuery = `SELECT COUNT(*) as total FROM unidades${whereClause}`;
    const countRows = await executeWithRetry(accessPool, countQuery, queryParams);
    const total = (countRows as Array<{ total: number }>)[0]?.total || 0;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const dataQuery = `
      SELECT * FROM unidades${whereClause}
      ORDER BY nome ASC
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `;
    const dataParams = [...queryParams, parseInt(limit), offset];
    const unidadeRows = await executeWithRetry(accessPool, dataQuery, dataParams);
    return NextResponse.json({
      data: unidadeRows,
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
    const validatedData = createUnidadeSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }
    const { ...payload } = validatedData.data;
    const [result] = await accessPool.execute(
      `INSERT INTO unidades (
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
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { error: 'ID da unidade é obrigatório' },
        { status: 400 }
      );
    }
    const body = await request.json();
    const validatedData = updateUnidadeSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }
    const { ...payload } = validatedData.data;
    await accessPool.execute(
      `UPDATE unidades SET 
        nome = ?
       WHERE id = ?`,
      [
        payload.nome,
        id
      ]
    );
    return NextResponse.json({ success: true });
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
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { error: 'ID da unidade é obrigatório' },
        { status: 400 }
      );
    }
    await accessPool.execute(
      'UPDATE unidades SET status = "Inativo" WHERE id = ?',
      [id]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}