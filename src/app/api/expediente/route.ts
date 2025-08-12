import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";
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

    let query = 'SELECT * FROM expedientes ';
    const params: (string | number)[] = [];

    if (search) {
      query += ' AND (dt_inicio LIKE ? OR dt_final LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Adicionar paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY nome ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [expedienteRows] = await gestorPool.execute(query, params);

    // Buscar total de registros para paginação
    let countQuery = 'SELECT COUNT(*) as total FROM expedientes ';
    const countParams: (string)[] = [];

    if (search) {
      countQuery += ' AND (dt_inicio LIKE ? OR dt_final LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countRows] = await gestorPool.execute(countQuery, countParams);
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
    const [result] = await gestorPool.execute(
      `INSERT INTO expedientes (
        dt_inicio, dt_final, h_inicio, h_final, intervalo, 
        semana, alocacoes_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.dtinicio, body.dtfinal, body.hinicio, body.hfinal,
        body.intervalo, body.semana, body.alocacaoId, 'Ativo'
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