import { NextRequest, NextResponse } from "next/server";
import { gestorPool, executeWithRetry } from "@/lib/mysql";
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

    let query = `
      SELECT 
        a.*,
        e.nome as especialidade_nome,
        u.nome as unidade_nome,
        p.nome as prestador_nome
      FROM alocacoes a
      LEFT JOIN especialidades e ON a.especialidade_id = e.id
      LEFT JOIN unidades u ON a.unidade_id = u.id
      LEFT JOIN prestadores p ON a.prestador_id = p.id
    `;
    const params: (string | number)[] = [];

    if (search) {
      query += ' WHERE (e.nome LIKE ? OR u.nome LIKE ? OR p.nome LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Adicionar paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY a.id ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const alocacaoRows = await executeWithRetry(gestorPool, query, params);

    // Buscar total de registros para paginação
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM alocacoes a
      LEFT JOIN especialidades e ON a.especialidade_id = e.id
      LEFT JOIN unidades u ON a.unidade_id = u.id
      LEFT JOIN prestadores p ON a.prestador_id = p.id
    `;
    const countParams: (string)[] = [];

    if (search) {
      countQuery += ' WHERE (e.nome LIKE ? OR u.nome LIKE ? OR p.nome LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countRows = await executeWithRetry(gestorPool, countQuery, countParams);
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
    const result = await executeWithRetry(gestorPool,
      `INSERT INTO alocacoes (
        unidade_id, especialidade_id, prestador_id
      ) VALUES (?, ?, ?)`,
      [
        body.unidade_id, body.especialidade_id, body.prestador_id
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