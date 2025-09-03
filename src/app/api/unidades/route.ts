import { NextRequest, NextResponse } from "next/server";
import { gestorPool, executeWithRetry } from "@/lib/mysql";
import { z } from "zod";
import { createUnidadeSchema, updateUnidadeSchema } from "./schema/formSchemaUnidades";

export type CreateUnidadeDTO = z.infer<typeof createUnidadeSchema>;
export type UpdateUnidadeDTO = z.infer<typeof updateUnidadeSchema>;

// GET - Listar unidades com paginação e busca
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';
    const all = searchParams.get('all') || '';

    // Se for para retornar todas as unidades (sem paginação)
    if (all === 'true' || limit === '1000') {
      console.log('🔍 Debug - Buscando todas as unidades');
      const [rows] = await gestorPool.execute(
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

    // 1. Construir a cláusula WHERE dinamicamente
    let whereClause = '';
    const queryParams: (string | number)[] = [];

    if (search) {
      whereClause = ' WHERE nome LIKE ?';
      queryParams.push(`%${search}%`);
    }

    // 2. Query para contar o total de registros
    const countQuery = `SELECT COUNT(*) as total FROM unidades${whereClause}`;
    const countRows = await executeWithRetry(gestorPool, countQuery, queryParams);
    const total = (countRows as Array<{ total: number }>)[0]?.total || 0;

    // 3. Query para buscar os dados com paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const dataQuery = `
      SELECT * FROM unidades${whereClause}
      ORDER BY nome ASC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...queryParams, parseInt(limit), offset];
    const unidadeRows = await executeWithRetry(gestorPool, dataQuery, dataParams);

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
    console.error('Erro ao buscar unidades:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar unidade
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

    // Inserir unidade
    const [result] = await gestorPool.execute(
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
    console.error('Erro ao criar unidade:', error);
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

// PUT - Atualizar unidade
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

    // Atualizar unidade
    await gestorPool.execute(
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
    console.error('Erro ao atualizar unidade:', error);
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

// DELETE - Deletar unidade
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

    // Soft delete - marcar como inativo
    await gestorPool.execute(
      'UPDATE unidades SET status = "Inativo" WHERE id = ?',
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar unidade:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}