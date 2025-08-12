import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";
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
    const unidadesId = searchParams.get('unidadesId');
    const prestadoresId = searchParams.get('prestadoresId');
    const especialidadesId = searchParams.get('especialidadesId');
    const date = searchParams.get('date');

    let query = 'SELECT a.* FROM agendas a WHERE 1=1';
    const params: (string | number)[] = [];

    if (search) {
      query += ' AND (a.dtagenda LIKE ? OR a.situacao LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (unidadesId) {
      query += ' AND a.unidadesId = ?';
      params.push(parseInt(unidadesId));
    }

    if (prestadoresId) {
      query += ' AND a.prestadoresId = ?';
      params.push(parseInt(prestadoresId));
    }

    if (especialidadesId) {
      query += ' AND a.especialidadesId = ?';
      params.push(parseInt(especialidadesId));
    }

    if (date) {
      query += ' AND DATE(a.dtagenda) = ?';
      params.push(date);
    }

    // Adicionar paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY a.dtagenda DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [agendaRows] = await gestorPool.execute(query, params);

    // Buscar total de registros para paginação
    let countQuery = 'SELECT COUNT(*) as total FROM agendas a WHERE 1=1';
    const countParams: (string | number)[] = [];

    if (search) {
      countQuery += ' AND (a.dtagenda LIKE ? OR a.situacao LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (unidadesId) {
      countQuery += ' AND a.unidadesId = ?';
      countParams.push(parseInt(unidadesId));
    }

    if (prestadoresId) {
      countQuery += ' AND a.prestadoresId = ?';
      countParams.push(parseInt(prestadoresId));
    }

    if (especialidadesId) {
      countQuery += ' AND a.especialidadesId = ?';
      countParams.push(parseInt(especialidadesId));
    }

    if (date) {
      countQuery += ' AND DATE(a.dtagenda) = ?';
      countParams.push(date);
    }

    const [countRows] = await gestorPool.execute(countQuery, countParams);
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
    const [result] = await gestorPool.execute(
      `INSERT INTO agendas (
        dtagenda, situacao, clientesId, conveniosId, procedimentosId,
        expedientesId, prestadoresId, unidadesId, especialidadesId,
        horario, tipo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.dtagenda, body.situacao, body.clientesId, body.conveniosId,
        body.procedimentosId, body.expedientesId, body.prestadoresId,
        body.unidadesId, body.especialidadesId, body.horario, body.tipo
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
    await gestorPool.execute(
      `UPDATE agendas SET 
        dtagenda = ?, situacao = ?, clientesId = ?, conveniosId = ?,
        procedimentosId = ?, expedientesId = ?, prestadoresId = ?,
        unidadesId = ?, especialidadesId = ?, horario = ?, tipo = ?
       WHERE id = ?`,
      [
        body.dtagenda, body.situacao, body.clientesId, body.conveniosId,
        body.procedimentosId, body.expedientesId, body.prestadoresId,
        body.unidadesId, body.especialidadesId, body.horario, body.tipo, id
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
    await gestorPool.execute(
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