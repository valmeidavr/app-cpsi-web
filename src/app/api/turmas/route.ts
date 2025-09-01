import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";
import { z } from "zod";
import { createTurmaSchema, updateTurmaSchema } from "./schema/formSchemaTurmas";

export type CreateTurmaDTO = z.infer<typeof createTurmaSchema>;
export type UpdateTurmaDTO = z.infer<typeof updateTurmaSchema>;

// GET - Listar turmas com paginação e busca
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';

    let query = `
      SELECT 
        t.*,
        p.nome as procedimento_nome,
        pr.nome as prestador_nome
      FROM turmas t
      LEFT JOIN procedimentos p ON t.procedimento_id = p.id
      LEFT JOIN prestadores pr ON t.prestador_id = pr.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (search) {
      query += ' AND (t.nome LIKE ? OR p.nome LIKE ? OR pr.nome LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Adicionar paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY t.nome ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [turmaRows] = await gestorPool.execute(query, params);

    // Buscar total de registros para paginação
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM turmas t
      LEFT JOIN procedimentos p ON t.procedimento_id = p.id
      LEFT JOIN prestadores pr ON t.prestador_id = pr.id
      WHERE 1=1
    `;
    const countParams: (string | number)[] = [];

    if (search) {
      countQuery += ' AND (t.nome LIKE ? OR p.nome LIKE ? OR pr.nome LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const [countRows] = await gestorPool.execute(countQuery, countParams);
    const total = (countRows as Array<{ total: number }>)[0]?.total || 0;

    return NextResponse.json({
      data: turmaRows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar turmas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar turma
export async function POST(request: NextRequest) {
  try {
    const body: CreateTurmaDTO = await request.json();

    console.log('🔍 Debug - Dados recebidos:', body);

    // Inserir turma
    const [result] = await gestorPool.execute(
      `INSERT INTO turmas (
        nome, horario_inicio, horario_fim, data_inicio, data_fim, limite_vagas, 
        procedimento_id, prestador_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.nome, 
        body.horario_inicio, 
        body.horario_fim, 
        body.data_inicio, 
        null, // data_fim começa como null
        body.limite_vagas, 
        body.procedimento_id, 
        body.prestador_id 
      ]
    );

    return NextResponse.json({ 
      success: true, 
      id: (result as { insertId: number }).insertId 
    });
  } catch (error) {
    console.error('Erro ao criar turma:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 

// PUT - Atualizar turma
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID da turma é obrigatório' },
        { status: 400 }
      );
    }

    const body: UpdateTurmaDTO = await request.json();

    // Atualizar turma
    await gestorPool.execute(
      `UPDATE turmas SET 
        nome = ?, horario_inicio = ?, horario_fim = ?, data_inicio = ?,
        limite_vagas = ?, procedimento_id = ?, prestador_id = ?
       WHERE id = ?`,
      [
        body.nome, body.horario_inicio, body.horario_fim, body.data_inicio,
        body.limite_vagas, body.procedimento_id, body.prestador_id, id
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar turma:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar turma
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID da turma é obrigatório' },
        { status: 400 }
      );
    }

    // DELETE - remover registro
    await gestorPool.execute(
      'DELETE FROM turmas WHERE id = ?',
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar turma:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 