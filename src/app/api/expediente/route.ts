import { NextRequest, NextResponse } from "next/server";
import { gestorPool, executeWithRetry } from "@/lib/mysql";
import { z } from "zod";
import { createExpedienteSchema, updateExpedienteSchema } from "./schema/formSchemaExpedientes";

export type CreateExpedienteDTO = z.infer<typeof createExpedienteSchema>;
export type UpdateExpedienteDTO = z.infer<typeof updateExpedienteSchema>;

// GET - Listar expedientes com paginação e busca
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';
    const alocacao_id = searchParams.get('alocacao_id');

    let query = `
      SELECT 
        e.id,
        e.dtinicio,
        e.dtfinal,
        e.hinicio,
        e.hfinal,
        e.intervalo,
        e.semana,
        e.alocacao_id,
        e.createdAt,
        e.updatedAt,
        a.unidade_id,
        a.especialidade_id,
        a.prestador_id,
        u.nome as unidade_nome,
        esp.nome as especialidade_nome,
        p.nome as prestador_nome
      FROM expedientes e
      LEFT JOIN alocacoes a ON e.alocacao_id = a.id
      LEFT JOIN unidades u ON a.unidade_id = u.id
      LEFT JOIN especialidades esp ON a.especialidade_id = esp.id
      LEFT JOIN prestadores p ON a.prestador_id = p.id
      WHERE 1=1
    `;
    
    // Debug: log da query construída
    console.log("Query construída:", query);
    const params: (string | number)[] = [];

    if (search) {
      query += ' AND (e.dtinicio LIKE ? OR e.dtfinal LIKE ? OR e.semana LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (alocacao_id) {
      query += ' AND e.alocacao_id = ?';
      params.push(parseInt(alocacao_id));
    }

    // Adicionar paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY e.dtinicio DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const expedienteRows = await executeWithRetry(gestorPool, query, params);
    
    // Debug: log dos dados retornados
    console.log("Query executada:", query);
    console.log("Parâmetros:", params);
    console.log("Dados retornados:", expedienteRows);

    // Buscar total de registros para paginação
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM expedientes e
      WHERE 1=1
    `;
    const countParams: (string | number)[] = [];

    if (search) {
      countQuery += ' AND (e.dtinicio LIKE ? OR e.dtfinal LIKE ? OR e.semana LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (alocacao_id) {
      countQuery += ' AND e.alocacao_id = ?';
      countParams.push(parseInt(alocacao_id));
    }

    const countRows = await executeWithRetry(gestorPool, countQuery, countParams);
    const total = (countRows as any[])[0]?.total || 0;

    return NextResponse.json({
      data: expedienteRows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar expedientes:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar expediente
export async function POST(request: NextRequest) {
  try {
    const body: CreateExpedienteDTO = await request.json();

    // Inserir expediente
    const result = await executeWithRetry(gestorPool,
      `INSERT INTO expedientes (
        dtinicio, dtfinal, hinicio, hfinal, intervalo, 
        semana, alocacao_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        body.dtinicio, body.dtfinal, body.hinicio, body.hfinal,
        body.intervalo, body.semana, body.alocacao_id
      ]
    );

    return NextResponse.json({ 
      success: true, 
      id: (result as any).insertId 
    });
  } catch (error) {
    console.error('Erro ao criar expediente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar expediente
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do expediente é obrigatório' },
        { status: 400 }
      );
    }

    const body: UpdateExpedienteDTO = await request.json();

    // Atualizar expediente
    await executeWithRetry(gestorPool,
      `UPDATE expedientes SET 
        dtinicio = ?, dtfinal = ?, hinicio = ?, hfinal = ?,
        intervalo = ?, semana = ?, alocacao_id = ?
       WHERE id = ?`,
      [
        body.dtinicio, body.dtfinal, body.hinicio, body.hfinal,
        body.intervalo, body.semana, body.alocacao_id, id
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar expediente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir expediente
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do expediente é obrigatório' },
        { status: 400 }
      );
    }

    // Excluir expediente
    await executeWithRetry(gestorPool,
      'DELETE FROM expedientes WHERE id = ?',
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir expediente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 