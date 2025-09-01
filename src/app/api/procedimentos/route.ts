import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";
import { z } from "zod";
import { createProcedimentoSchema, updateProcedimentoSchema } from "./schema/formSchemaProcedimentos";

export type CreateProcedimentoDTO = z.infer<typeof createProcedimentoSchema>;
export type UpdateProcedimentoDTO = z.infer<typeof updateProcedimentoSchema>;

// GET - Listar procedimentos com paginação e busca
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';

    let query = 'SELECT * FROM procedimentos WHERE status = "Ativo"';
    const params: (string | number)[] = [];

    if (search) {
      query += ' AND (nome LIKE ? OR codigo LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Adicionar paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY nome ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [procedimentoRows] = await gestorPool.execute(query, params);

    // Buscar total de registros para paginação
    let countQuery = 'SELECT COUNT(*) as total FROM procedimentos WHERE status = "Ativo"';
    const countParams: (string)[] = [];

    if (search) {
      countQuery += ' AND (nome LIKE ? OR codigo LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countRows] = await gestorPool.execute(countQuery, countParams);
    const total = (countRows as Array<{ total: number }>)[0]?.total || 0;

    return NextResponse.json({
      data: procedimentoRows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar procedimentos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar procedimento
export async function POST(request: NextRequest) {
  try {
    const body: CreateProcedimentoDTO = await request.json();

    // Inserir procedimento
    const [result] = await gestorPool.execute(
      `INSERT INTO procedimentos (
        nome, codigo, tipo, especialidade_id, status
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        body.nome, body.codigo, body.tipo, body.especialidade_id, 'Ativo'
      ]
    );

    return NextResponse.json({ 
      success: true, 
      id: (result as { insertId: number }).insertId 
    });
  } catch (error) {
    console.error('Erro ao criar procedimento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 

// PUT - Atualizar procedimento
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do procedimento é obrigatório' },
        { status: 400 }
      );
    }

    const body: UpdateProcedimentoDTO = await request.json();

    // Atualizar procedimento
    await gestorPool.execute(
      `UPDATE procedimentos SET 
        nome = ?, codigo = ?, tipo = ?, especialidade_id = ?
       WHERE id = ?`,
      [
        body.nome, body.codigo, body.tipo, body.especialidade_id, id
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar procedimento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar procedimento
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do procedimento é obrigatório' },
        { status: 400 }
      );
    }

    // Soft delete - marcar como inativo
    await gestorPool.execute(
      'UPDATE procedimentos SET status = "Inativo" WHERE id = ?',
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar procedimento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 