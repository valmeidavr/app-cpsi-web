import { NextRequest, NextResponse } from "next/server";
import { gestorPool, executeWithRetry } from "@/lib/mysql";
import { z } from "zod";
import { createAgendaSchema, updateAgendaSchema } from "./schema/formSchemaAgendas";

export type CreateAgendaDTO = z.infer<typeof createAgendaSchema>;
export type UpdateAgendaDTO = z.infer<typeof updateAgendaSchema>;

// GET - Listar agendas com paginação e busca
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';
    
    // Aceitar ambos os formatos de parâmetros para compatibilidade
    const unidadeId = searchParams.get('unidadeId') || searchParams.get('unidade_id');
    const prestadorId = searchParams.get('prestadorId') || searchParams.get('prestador_id');
    const especialidadeId = searchParams.get('especialidadeId') || searchParams.get('especialidade_id');
    const date = searchParams.get('date');

    // Debug: log dos parâmetros recebidos
    console.log("Parâmetros recebidos na API de agendas:", {
      unidadeId,
      prestadorId,
      especialidadeId,
      date,
      searchParams: Object.fromEntries(searchParams.entries())
    });

    let query = `
      SELECT 
        a.*,
        c.nome as cliente_nome,
        cv.nome as convenio_nome,
        p.nome as procedimento_nome,
        e.nome as expediente_nome,
        pr.nome as prestador_nome,
        u.nome as unidade_nome,
        esp.nome as especialidade_nome
      FROM agendas a
      LEFT JOIN clientes c ON a.cliente_id = c.id
      LEFT JOIN convenios cv ON a.convenio_id = cv.id
      LEFT JOIN procedimentos p ON a.procedimento_id = p.id
      LEFT JOIN expedientes e ON a.expediente_id = e.id
      LEFT JOIN prestadores pr ON a.prestador_id = pr.id
      LEFT JOIN unidades u ON a.unidade_id = u.id
      LEFT JOIN especialidades esp ON a.especialidade_id = esp.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (search) {
      query += ' AND (a.situacao LIKE ? OR c.nome LIKE ? OR pr.nome LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (unidadeId) {
      query += ' AND a.unidade_id = ?';
      params.push(parseInt(unidadeId));
    }

    if (prestadorId) {
      query += ' AND a.prestador_id = ?';
      params.push(parseInt(prestadorId));
    }

    if (especialidadeId) {
      query += ' AND a.especialidade_id = ?';
      params.push(parseInt(especialidadeId));
    }

    if (date) {
      query += ' AND DATE(a.dtagenda) = ?';
      params.push(date);
    }

    // Debug: log da query construída
    console.log("Query construída:", query);
    console.log("Parâmetros:", params);

    // Adicionar paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY a.dtagenda DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const agendaRows = await executeWithRetry(gestorPool, query, params);

    // Buscar total de registros para paginação
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM agendas a
      LEFT JOIN clientes c ON a.cliente_id = c.id
      LEFT JOIN prestadores pr ON a.prestador_id = pr.id
      WHERE 1=1
    `;
    const countParams: (string | number)[] = [];

    if (search) {
      countQuery += ' AND (a.situacao LIKE ? OR c.nome LIKE ? OR pr.nome LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (unidadeId) {
      countQuery += ' AND a.unidade_id = ?';
      countParams.push(parseInt(unidadeId));
    }

    if (prestadorId) {
      countQuery += ' AND a.prestador_id = ?';
      countParams.push(parseInt(prestadorId));
    }

    if (especialidadeId) {
      countQuery += ' AND a.especialidade_id = ?';
      countParams.push(parseInt(especialidadeId));
    }

    if (date) {
      countQuery += ' AND DATE(a.dtagenda) = ?';
      countParams.push(date);
    }

    // Debug: log da query de contagem
    console.log("Query de contagem:", countQuery);
    console.log("Parâmetros de contagem:", countParams);

    const countRows = await executeWithRetry(gestorPool, countQuery, countParams);
    const total = (countRows as any[])[0]?.total || 0;

    return NextResponse.json({
      data: agendaRows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar agendas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar agenda
export async function POST(request: NextRequest) {
  try {
    const body: CreateAgendaDTO = await request.json();

    // Inserir agenda
    const result = await executeWithRetry(gestorPool,
      `INSERT INTO agendas (
        dtagenda, situacao, cliente_id, convenio_id, procedimento_id,
        expediente_id, prestador_id, unidade_id, especialidade_id, tipo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.dtagenda, body.situacao, body.cliente_id, body.convenio_id,
        body.procedimento_id, body.expediente_id, body.prestador_id,
        body.unidade_id, body.especialidade_id, body.tipo
      ]
    );

    return NextResponse.json({ 
      success: true, 
      id: (result as any).insertId 
    });
  } catch (error) {
    console.error('Erro ao criar agenda:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar agenda
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID da agenda é obrigatório' },
        { status: 400 }
      );
    }

    const body: UpdateAgendaDTO = await request.json();

    // Atualizar agenda
    await executeWithRetry(gestorPool,
      `UPDATE agendas SET 
        dtagenda = ?, situacao = ?, cliente_id = ?, convenio_id = ?,
        procedimento_id = ?, expediente_id = ?, prestador_id = ?,
        unidade_id = ?, especialidade_id = ?, tipo = ?
       WHERE id = ?`,
      [
        body.dtagenda, body.situacao, body.cliente_id, body.convenio_id,
        body.procedimento_id, body.expediente_id, body.prestador_id,
        body.unidade_id, body.especialidade_id, body.tipo, id
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar agenda:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar agenda
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID da agenda é obrigatório' },
        { status: 400 }
      );
    }

    // DELETE - remover registro
    await executeWithRetry(gestorPool,
      'DELETE FROM agendas WHERE id = ?',
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar agenda:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 