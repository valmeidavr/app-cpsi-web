import { NextRequest, NextResponse } from "next/server";
import { accessPool, executeWithRetry } from "@/lib/mysql";
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
    const alocacao_id = searchParams.get('alocacao_id');

    let query = `
      SELECT 
        e.id,
        e.dtinicio,
        e.dtfinal,
        e.hinicio,
        e.hfinal,
        e.intervalo,
        e.semana,
        e.alocacao_id,
        e.createdAt,
        e.updatedAt,
        a.unidade_id,
        a.especialidade_id,
        a.prestador_id,
        u.nome as unidade_nome,
        esp.nome as especialidade_nome,
        p.nome as prestador_nome
      FROM expedientes e
      LEFT JOIN alocacoes a ON e.alocacao_id = a.id
      LEFT JOIN unidades u ON a.unidade_id = u.id
      LEFT JOIN especialidades esp ON a.especialidade_id = esp.id
      LEFT JOIN prestadores p ON a.prestador_id = p.id
      WHERE 1=1
    `;
    
    // Debug: log da query construída
    console.log("Query construída:", query);
    const params: (string | number)[] = [];

    if (search) {
      query += ' AND (e.dtinicio LIKE ? OR e.dtfinal LIKE ? OR e.semana LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (alocacao_id) {
      query += ' AND e.alocacao_id = ?';
      params.push(parseInt(alocacao_id));
    }

    // Adicionar paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY u.nome ASC LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    // Parâmetros de paginação inseridos diretamente na query;

    const expedienteRows = await executeWithRetry(accessPool, query, params);
    
    // Debug: verificar dados retornados
    console.log("🔍 Query executada:", query);
    console.log("🔍 Parâmetros:", params);
    console.log("✅ Expedientes encontrados:", (expedienteRows as Array<{
      id: number;
      dtinicio: string;
      dtfinal: string;
      hinicio: string;
      hfinal: string;
      intervalo: number;
      semana: string;
      alocacao_id: number;
      createdAt: Date;
      updatedAt: Date;
    }>)?.length || 0);
    console.log("🔍 Primeiro expediente:", (expedienteRows as Array<{
      id: number;
      dtinicio: string;
      dtfinal: string;
      hinicio: string;
      hfinal: string;
      intervalo: number;
      semana: string;
      alocacao_id: number;
      createdAt: Date;
      updatedAt: Date;
    }>)?.[0]);

    // Buscar total de registros para paginação
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM expedientes e
      WHERE 1=1
    `;
    const countParams: (string | number)[] = [];

    if (search) {
      countQuery += ' AND (e.dtinicio LIKE ? OR e.dtfinal LIKE ? OR e.semana LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (alocacao_id) {
      countQuery += ' AND e.alocacao_id = ?';
      countParams.push(parseInt(alocacao_id));
    }

    const countRows = await executeWithRetry(accessPool, countQuery, countParams);
    const total = (countRows as Array<{ total: number }>)[0]?.total || 0;
    
    // Debug: verificar contagem
    console.log("🔍 Query de contagem:", countQuery);
    console.log("🔍 Parâmetros de contagem:", countParams);
    console.log("✅ Total de expedientes:", total);

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
    const body = await request.json();
    const validatedData = createExpedienteSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    const { ...payload } = validatedData.data;

    console.log("🔍 Criando expediente:", payload);

    // 1. Inserir expediente
    const expedienteResult = await executeWithRetry(accessPool,
      `INSERT INTO expedientes (
        dtinicio, dtfinal, hinicio, hfinal, intervalo, 
        semana, alocacao_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.dtinicio, payload.dtfinal, payload.hinicio, payload.hfinal,
        payload.intervalo, payload.semana, payload.alocacao_id
      ]
    );

    const expedienteId = (expedienteResult as { insertId: number }).insertId;
    console.log("✅ Expediente criado com ID:", expedienteId);

    // 2. Buscar dados da alocação
    const alocacaoRows = await executeWithRetry(accessPool,
      `SELECT 
        a.unidade_id,
        a.especialidade_id,
        a.prestador_id
       FROM alocacoes a 
       WHERE a.id = ?`,
      [payload.alocacao_id]
    );

    if (!alocacaoRows || (alocacaoRows as Array<{
      unidade_id: number;
      especialidade_id: number;
      prestador_id: number;
    }>).length === 0) {
      throw new Error(`Alocação com ID ${payload.alocacao_id} não encontrada`);
    }

    const alocacao = (alocacaoRows as Array<{
      unidade_id: number;
      especialidade_id: number;
      prestador_id: number;
    }>)[0];
    console.log("✅ Dados da alocação:", alocacao);

    // 3. Mapear dias da semana
    const diasDaSemana: Record<string, number> = {
      "Domingo": 0,
      "Segunda": 1,
      "Terça": 2,
      "Quarta": 3,
      "Quinta": 4,
      "Sexta": 5,
      "Sábado": 6
    };

    if (!payload.semana || !(payload.semana in diasDaSemana)) {
      throw new Error(`Dia da semana inválido: ${payload.semana}`);
    }

    const semanaIndex = diasDaSemana[payload.semana];
    console.log("✅ Índice da semana:", semanaIndex);

    // 4. Gerar datas válidas
    const dataInicial = new Date(payload.dtinicio);
    const dataFinal = new Date(payload.dtfinal);

    // Validar se as datas são válidas
    if (isNaN(dataInicial.getTime()) || isNaN(dataFinal.getTime())) {
      return NextResponse.json(
        { error: "Datas inválidas fornecidas" },
        { status: 400 }
      );
    }

    // Gerar datas entre dataInicial e dataFinal
    const datasValidas: Date[] = [];
    const dataAtual = new Date(dataInicial);
    
    while (dataAtual <= dataFinal) {
      datasValidas.push(new Date(dataAtual));
      dataAtual.setDate(dataAtual.getDate() + 1);
    }

    if (datasValidas.length === 0) {
      throw new Error(
        `Não existe nenhuma data correspondente à semana "${payload.semana}" entre ${payload.dtinicio} e ${payload.dtfinal}.`
      );
    }

    console.log("✅ Datas válidas encontradas:", datasValidas.length);

    // 5. Gerar agendamentos
    const agendasToCreate: Array<{
      dtagenda: Date;
      situacao: string;
      expediente_id: number;
      prestador_id: number;
      unidade_id: number;
      especialidade_id: number;
      tipo: string;
    }> = [];
    const intervaloMin = parseInt(payload.intervalo, 10);

    for (const data of datasValidas) {
      const [hStart, mStart] = payload.hinicio.split(':').map(Number);
      const [hEnd, mEnd] = payload.hfinal.split(':').map(Number);

      let startMinutes = hStart * 60 + mStart;
      const endMinutes = hEnd * 60 + mEnd;

      while (startMinutes + intervaloMin <= endMinutes) {
        const hora = Math.floor(startMinutes / 60);
        const minuto = startMinutes % 60;

        const agendaDate = new Date(data);
        agendaDate.setHours(hora, minuto, 0, 0);

        agendasToCreate.push({
          dtagenda: agendaDate,
          situacao: "LIVRE",
          expediente_id: expedienteId,
          prestador_id: alocacao.prestador_id,
          unidade_id: alocacao.unidade_id,
          especialidade_id: alocacao.especialidade_id,
          tipo: "PROCEDIMENTO"
        });

        startMinutes += intervaloMin;
      }
    }

    console.log("✅ Agendamentos a serem criados:", agendasToCreate.length);

    // 6. Inserir agendamentos em lote
    if (agendasToCreate.length > 0) {
      const values = agendasToCreate.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
      const params = agendasToCreate.flatMap(agenda => [
        agenda.dtagenda,
        agenda.situacao,
        agenda.expediente_id,
        agenda.prestador_id,
        agenda.unidade_id,
        agenda.especialidade_id,
        agenda.tipo
      ]);

      await executeWithRetry(accessPool,
        `INSERT INTO agendas (
          dtagenda, situacao, expediente_id, prestador_id, 
          unidade_id, especialidade_id, tipo
        ) VALUES ${values}`,
        params
      );

      console.log("✅ Agendamentos criados com sucesso");
    }

    return NextResponse.json({ 
      success: true, 
      expedienteId,
      agendamentosCriados: agendasToCreate.length,
      message: 'Expediente e agendamentos criados com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao criar expediente:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar expediente
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do expediente é obrigatório' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateExpedienteSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    const { ...payload } = validatedData.data;

    // Atualizar expediente
    await executeWithRetry(accessPool,
      `UPDATE expedientes SET 
        dtinicio = ?, dtfinal = ?, hinicio = ?, hfinal = ?,
        intervalo = ?, semana = ?, alocacao_id = ?
       WHERE id = ?`,
      [
        payload.dtinicio, payload.dtfinal, payload.hinicio, payload.hfinal,
        payload.intervalo, payload.semana, payload.alocacao_id, id
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar expediente:', error);
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

// DELETE - Excluir expediente
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do expediente é obrigatório' },
        { status: 400 }
      );
    }

    // Soft delete - marcar como inativo
    await executeWithRetry(accessPool,
      'UPDATE expedientes SET status = "Inativo" WHERE id = ?',
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir expediente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}