import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";
import { z } from "zod";
import { createTabelaFaturamentoSchema, updateTabelaFaturamentoSchema } from "./schema/formSchemaEspecialidade";

export type CreateTabelaFaturamentoDTO = z.infer<typeof createTabelaFaturamentoSchema>;
export type UpdateTabelaFaturamentoDTO = z.infer<typeof updateTabelaFaturamentoSchema>;

// GET - Listar tabela de faturamentos com paginação e busca
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';

    let query = 'SELECT * FROM tabela_faturamentos ';
    const params: (string | number)[] = [];

    if (search) {
      query += ' AND (nome LIKE ? OR descricao LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Adicionar paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY nome ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [tabelaRows] = await gestorPool.execute(query, params);

    // Buscar total de registros para paginação
    let countQuery = 'SELECT COUNT(*) as total FROM tabela_faturamentos ';
    const countParams: (string)[] = [];

    if (search) {
      countQuery += ' AND (nome LIKE ? OR descricao LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countRows] = await gestorPool.execute(countQuery, countParams);
    const total = (countRows as any[])[0]?.total || 0;

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
    console.error('Erro ao buscar tabela de faturamentos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateTabelaFaturamentoDTO = await request.json();

    const [result] = await gestorPool.execute(
      `INSERT INTO tabela_faturamentos (
        nome
      ) VALUES (?)`,
      [
        body.nome,
      ]
    );

    return NextResponse.json({
      success: true,
      id: (result as any).insertId
    });
  } catch (error) {
    console.error('Erro ao criar tabela de faturamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 