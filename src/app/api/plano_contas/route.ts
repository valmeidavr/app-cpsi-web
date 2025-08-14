import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";
import { z } from "zod";
import { createPlanosSchema, updatePlanosSchema } from "./schema/formSchemaPlanos";

export type CreatePlanoContaDTO = z.infer<typeof createPlanosSchema>;
export type UpdatePlanoContaDTO = z.infer<typeof updatePlanosSchema>;

// GET - Listar plano de contas com paginação e busca
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';

    let query = 'SELECT * FROM plano_contas ';
    const params: (string | number)[] = [];

    if (search) {
      query += ' AND (nome LIKE ? OR categoria LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Adicionar paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY nome ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [planoRows] = await gestorPool.execute(query, params);

    // Buscar total de registros para paginação
    let countQuery = 'SELECT COUNT(*) as total FROM plano_contas ';
    const countParams: (string)[] = [];

    if (search) {
      countQuery += ' AND (nome LIKE ? OR categoria LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countRows] = await gestorPool.execute(countQuery, countParams);
    const total = (countRows as any[])[0]?.total || 0;

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
    console.error('Erro ao buscar plano de contas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar plano de conta
export async function POST(request: NextRequest) {
  try {
    const body: CreatePlanoContaDTO = await request.json();

    // Inserir plano de conta
    const [result] = await gestorPool.execute(
      `INSERT INTO plano_contas (
        nome, tipo, categoria, descricao
      ) VALUES (?, ?, ?, ?)`,
      [
        body.nome, body.tipo, body.categoria, body.descricao
      ]
    );

    return NextResponse.json({ 
      success: true, 
      id: (result as any).insertId 
    });
  } catch (error) {
    console.error('Erro ao criar plano de conta:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 