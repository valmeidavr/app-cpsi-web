import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";
import { createAlunoTurmaSchema } from "./schema/formSchemaAlunosTurmas";
import { z } from "zod";

// GET - Listar alunos de turmas com paginação e busca
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';
    const turmaId = searchParams.get('turmaId') || '';

    let query = `
      SELECT 
        at.id,
        at.turma_id,
        at.cliente_id,
        at.data_inscricao,
        at.createdAt,
        at.updatedAt,
        JSON_OBJECT(
          'id', c.id,
          'nome', c.nome,
          'cpf', c.cpf,
          'telefone1', c.telefone1,
          'dtnascimento', c.dtnascimento,
          'status', c.status
        ) as cliente
      FROM alunos_turmas at
      LEFT JOIN clientes c ON at.cliente_id = c.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (turmaId) {
      query += ' AND at.turma_id = ?';
      params.push(parseInt(turmaId));
    }

    if (search) {
      query += ' AND (c.nome LIKE ? OR c.cpf LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Adicionar paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY c.nome ASC LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    // Parâmetros de paginação inseridos diretamente na query;

    const [alunoTurmaRows] = await accessPool.execute(query, params);

    // Buscar total de registros para paginação
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM alunos_turmas at
      LEFT JOIN clientes c ON at.cliente_id = c.id
      WHERE 1=1
    `;
    const countParams: (string | number)[] = [];

    if (turmaId) {
      countQuery += ' AND at.turma_id = ?';
      countParams.push(parseInt(turmaId));
    }

    if (search) {
      countQuery += ' AND (c.nome LIKE ? OR c.cpf LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countRows] = await accessPool.execute(countQuery, countParams);
    const total = (countRows as Array<{ total: number }>)[0]?.total || 0;

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
    
    // Validar dados com Zod
    const validatedData = createAlunoTurmaSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    // Inserir aluno em turma
    const [result] = await accessPool.execute(
      `INSERT INTO alunos_turmas (
        cliente_id, turma_id, data_inscricao, status
      ) VALUES (?, ?, ?, ?)`,
      [
        validatedData.data.cliente_id, validatedData.data.turma_id, validatedData.data.data_inscricao || new Date().toISOString(), 'Ativo'
      ]
    );

    return NextResponse.json({ 
      success: true, 
      id: (result as { insertId: number }).insertId 
    });
  } catch (error) {
    console.error('Erro ao criar aluno em turma:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 