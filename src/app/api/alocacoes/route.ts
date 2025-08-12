import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";
import { z } from "zod";
import { createAlocacaoSchema, updateAlocacaoSchema } from "./shema/formSchemaAlocacao";

export type CreateAlocacaoDTO = z.infer<typeof createAlocacaoSchema>;
export type UpdateAlocacaoDTO = z.infer<typeof updateAlocacaoSchema>;

// GET - Listar alocações com paginação e busca
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';

    let query = 'SELECT * FROM alocacoes ';
    const params: (string | number)[] = [];

    if (search) {
      query += ' AND (especialidades_id LIKE ? OR unidades_id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Adicionar paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY nome ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [alocacaoRows] = await gestorPool.execute(query, params);

    // Buscar total de registros para paginação
    let countQuery = 'SELECT COUNT(*) as total FROM alocacoes ';
    const countParams: (string)[] = [];

    if (search) {
      countQuery += ' AND (especialidades_id LIKE ? OR unidades_id LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countRows] = await gestorPool.execute(countQuery, countParams);
    const total = (countRows as any[])[0]?.total || 0;

    return NextResponse.json({
      data: alocacaoRows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar alocações:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar alocação
export async function POST(request: NextRequest) {
  try {
    const body: CreateAlocacaoDTO = await request.json();

    // Inserir alocação
    const [result] = await gestorPool.execute(
      `INSERT INTO alocacoes (
        especialidades_id, unidades_id, prestadores_id, status
      ) VALUES (?, ?, ?, ?)`,
      [
        body.especialidadesId, body.unidadesId, body.prestadoresId, 'Ativo'
      ]
    );

    return NextResponse.json({ 
      success: true, 
      id: (result as any).insertId 
    });
  } catch (error) {
    console.error('Erro ao criar alocação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 