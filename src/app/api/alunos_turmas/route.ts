import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";
import { z } from "zod";

// GET - Listar alunos de turmas com paginação e busca
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';
    const turmaId = searchParams.get('turmaId') || '';

    let query = 'SELECT * FROM alunos_turmas ';
    const params: (string | number)[] = [];

    if (turmaId) {
      query += ' AND at.turmas_id = ?';
      params.push(turmaId);
    }

    if (search) {
      query += ' AND (alunos_id LIKE ? OR turmas_id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Adicionar paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [alunoTurmaRows] = await gestorPool.execute(query, params);

    // Buscar total de registros para paginação
    let countQuery = 'SELECT COUNT(*) as total FROM alunos_turmas ';
    const countParams: (string)[] = [];

    if (turmaId) {
      countQuery += ' AND at.turmas_id = ?';
      countParams.push(turmaId);
    }

    if (search) {
      countQuery += ' AND (alunos_id LIKE ? OR turmas_id LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countRows] = await gestorPool.execute(countQuery, countParams);
    const total = (countRows as any[])[0]?.total || 0;

    return NextResponse.json({
      data: alunoTurmaRows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar alunos de turmas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar aluno em turma
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Inserir aluno em turma
    const [result] = await gestorPool.execute(
      `INSERT INTO alunos_turmas (
        alunos_id, turmas_id, status
      ) VALUES (?, ?, ?)`,
      [
        body.alunosId, body.turmasId, 'Ativo'
      ]
    );

    return NextResponse.json({ 
      success: true, 
      id: (result as any).insertId 
    });
  } catch (error) {
    console.error('Erro ao criar aluno em turma:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 