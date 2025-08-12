import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";
import { z } from "zod";
import { createLancamentoSchema, updateLancamentoSchema } from "./schema/formSchemeLancamentos";

export type CreateLancamentoDTO = z.infer<typeof createLancamentoSchema>;
export type UpdateLancamentoDTO = z.infer<typeof updateLancamentoSchema>;

// GET - Listar lançamentos com paginação e busca
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';

    let query = 'SELECT * FROM lancamentos ';
    const params: (string | number)[] = [];

    if (search) {
      query += ' AND (descricao LIKE ? OR tipo LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Adicionar paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY data_lancamento DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [lancamentoRows] = await gestorPool.execute(query, params);

    // Buscar total de registros para paginação
    let countQuery = 'SELECT COUNT(*) as total FROM lancamentos ';
    const countParams: (string)[] = [];

    if (search) {
      countQuery += ' AND (descricao LIKE ? OR tipo LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countRows] = await gestorPool.execute(countQuery, countParams);
    const total = (countRows as any[])[0]?.total || 0;

    return NextResponse.json({
      data: lancamentoRows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar lançamentos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar lançamento
export async function POST(request: NextRequest) {
  try {
    const body: CreateLancamentoDTO = await request.json();

    // Inserir lançamento
    const [result] = await gestorPool.execute(
      `INSERT INTO lancamentos (
        descricao, valor, tipo, data_lancamento, forma_pagamento, 
        status_pagamento, clientes_id, plano_contas_id, caixas_id, 
        usuario_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.descricao, body.valor, body.tipo, body.data_lancamento,
        body.forma_pagamento, body.status_pagamento, body.clientes_Id,
        body.plano_contas_id, body.caixas_id, body.usuario_id
      ]
    );

    return NextResponse.json({ 
      success: true, 
      id: (result as any).insertId 
    });
  } catch (error) {
    console.error('Erro ao criar lançamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 

// PUT - Atualizar lançamento
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do lançamento é obrigatório' },
        { status: 400 }
      );
    }

    const body: UpdateLancamentoDTO = await request.json();

    // Atualizar lançamento
    await gestorPool.execute(
      `UPDATE lancamentos SET 
        descricao = ?, valor = ?, tipo = ?, data_lancamento = ?,
        forma_pagamento = ?, status_pagamento = ?, clientes_id = ?,
        plano_contas_id = ?, caixas_id = ?, usuario_id = ?
       WHERE id = ?`,
      [
        body.descricao, body.valor, body.tipo, body.data_lancamento,
        body.forma_pagamento, body.status_pagamento, body.clientes_Id,
        body.plano_contas_id, body.caixas_id, body.usuario_id, id
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar lançamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar lançamento
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do lançamento é obrigatório' },
        { status: 400 }
      );
    }

    // DELETE - remover registro
    await gestorPool.execute(
      'DELETE FROM lancamentos WHERE id = ?',
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar lançamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 