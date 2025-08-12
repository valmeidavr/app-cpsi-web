import { NextRequest, NextResponse } from "next/server";
import { gestorPool, executeWithRetry } from "@/lib/mysql";
import { z } from "zod";
import { createEspecialidadeSchema, updateEspecialidadeSchema } from "./schema/formSchemaEspecialidade";

export type CreateEspecialidadeDTO = z.infer<typeof createEspecialidadeSchema>;
export type UpdateEspecialidadeDTO = z.infer<typeof updateEspecialidadeSchema>;

// GET - Listar especialidades com paginação e busca
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';

    // 1. Construir a cláusula WHERE dinamicamente
    let whereClause = '';
    const queryParams: (string | number)[] = [];

    if (search) {
      whereClause = ' WHERE nome LIKE ?';
      queryParams.push(`%${search}%`);
    }

    // 2. Query para contar o total de registros
    const countQuery = `SELECT COUNT(*) as total FROM especialidades${whereClause}`;
    const countRows = await executeWithRetry(gestorPool, countQuery, queryParams);
    const total = (countRows as any[])[0]?.total || 0;

    // 3. Query para buscar os dados com paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const dataQuery = `
      SELECT * FROM especialidades${whereClause}
      ORDER BY nome ASC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...queryParams, parseInt(limit), offset];
    const especialidadeRows = await executeWithRetry(gestorPool, dataQuery, dataParams);

    return NextResponse.json({
      data: especialidadeRows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar especialidades:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar especialidade
export async function POST(request: NextRequest) {
  try {
    const body: CreateEspecialidadeDTO = await request.json();

    // Inserir especialidade
    const [result] = await gestorPool.execute(
      `INSERT INTO especialidades (
        nome, codigo, status
      ) VALUES (?, ?, ?)`,
      [
        body.nome, body.codigo, 'Ativo'
      ]
    );

    return NextResponse.json({ 
      success: true, 
      id: (result as any).insertId 
    });
  } catch (error) {
    console.error('Erro ao criar especialidade:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 

// PUT - Atualizar especialidade
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID da especialidade é obrigatório' },
        { status: 400 }
      );
    }

    const body: UpdateEspecialidadeDTO = await request.json();

    // Atualizar especialidade
    await gestorPool.execute(
      `UPDATE especialidades SET 
        nome = ?, codigo = ?
       WHERE id = ?`,
      [
        body.nome, body.codigo, id
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar especialidade:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar especialidade
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID da especialidade é obrigatório' },
        { status: 400 }
      );
    }

    // Soft delete - marcar como inativo
    await gestorPool.execute(
      'UPDATE especialidades SET status = "Inativo" WHERE id = ?',
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar especialidade:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 