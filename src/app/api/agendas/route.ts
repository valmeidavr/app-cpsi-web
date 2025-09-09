import { NextRequest, NextResponse } from "next/server";
import { accessPool, executeWithRetry } from "@/lib/mysql";
import { z } from "zod";
import { createAgendaSchema, updateAgendaSchema } from "./schema/formSchemaAgendas";
import { getCurrentUTCISO } from "@/app/helpers/dateUtils";
export type CreateAgendaDTO = z.infer<typeof createAgendaSchema>;
export type UpdateAgendaDTO = z.infer<typeof updateAgendaSchema>;
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';
    const unidadeId = searchParams.get('unidadeId') || searchParams.get('unidade_id');
    const prestadorId = searchParams.get('prestadorId') || searchParams.get('prestador_id');
    const especialidadeId = searchParams.get('especialidadeId') || searchParams.get('especialidade_id');
    const date = searchParams.get('date');
    let query = `
      SELECT 
        a.*,
        c.nome as cliente_nome,
        c.cpf as cliente_cpf,
        c.email as cliente_email,
        cv.nome as convenio_nome,
        p.nome as procedimento_nome,
        p.codigo as procedimento_codigo,
        pr.nome as prestador_nome,
        u.nome as unidade_nome,
        esp.nome as especialidade_nome
      FROM agendas a
      LEFT JOIN clientes c ON a.cliente_id = c.id
      LEFT JOIN convenios cv ON a.convenio_id = cv.id
      LEFT JOIN procedimentos p ON a.procedimento_id = p.id
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
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY c.nome ASC LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    const agendaRows = await executeWithRetry(accessPool, query, params);
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM agendas a
      LEFT JOIN clientes c ON a.cliente_id = c.id
      LEFT JOIN prestadores pr ON a.prestador_id = pr.id
      LEFT JOIN unidades u ON a.unidade_id = u.id
      LEFT JOIN especialidades esp ON a.especialidade_id = esp.id
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
    const countRows = await executeWithRetry(accessPool, countQuery, countParams);
    const total = (countRows as Array<{ total: number }>)[0]?.total || 0;
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
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    console.log("📥 [AGENDA POST] Iniciando criação de agenda");
    const body = await request.json();
    console.log("📝 [AGENDA POST] Body recebido:", JSON.stringify(body, null, 2));
    
    const validatedData = createAgendaSchema.safeParse(body);
    if (!validatedData.success) {
      console.error("❌ [AGENDA POST] Validação falhou:", validatedData.error.flatten());
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }
    
    const { ...payload } = validatedData.data;
    console.log("✅ [AGENDA POST] Dados validados:", JSON.stringify(payload, null, 2));
    console.log("💾 [AGENDA POST] Executando INSERT na tabela agendas");
    const result = await executeWithRetry(accessPool,
      `INSERT INTO agendas (
        dtagenda, situacao, cliente_id, convenio_id, procedimento_id,
        expediente_id, prestador_id, unidade_id, especialidade_id, tipo, tipo_cliente
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.dtagenda, payload.situacao, payload.cliente_id, payload.convenio_id,
        payload.procedimento_id, payload.expediente_id || null, payload.prestador_id,
        payload.unidade_id, payload.especialidade_id, payload.tipo, payload.tipo_cliente
      ]
    );
    console.log("✅ [AGENDA POST] INSERT executado com sucesso, ID:", (result as { insertId: number }).insertId);
    const agendaId = (result as { insertId: number }).insertId;
    try {
      let clienteNome = 'Cliente não informado';
      if (payload.cliente_id) {
        const [clienteRows] = await accessPool.execute(
          'SELECT nome FROM clientes WHERE id = ?',
          [payload.cliente_id]
        );
        if ((clienteRows as Array<{ nome: string }>).length > 0) {
          clienteNome = (clienteRows as Array<{ nome: string }>)[0].nome;
        }
      }
      let procedimentoNome = 'Procedimento não informado';
      if (payload.procedimento_id) {
        const [procedimentoRows] = await accessPool.execute(
          'SELECT nome FROM procedimentos WHERE id = ?',
          [payload.procedimento_id]
        );
        if ((procedimentoRows as Array<{ nome: string }>).length > 0) {
          procedimentoNome = (procedimentoRows as Array<{ nome: string }>)[0].nome;
        }
      }
      const [caixaRows] = await accessPool.execute(
        'SELECT id FROM caixas WHERE status = "Ativo" LIMIT 1'
      );
      let caixaId = 1; // Caixa padrão se não houver nenhum
      if ((caixaRows as Array<{ id: number }>).length > 0) {
        caixaId = (caixaRows as Array<{ id: number }>)[0].id;
      }
      const [planoContaRows] = await accessPool.execute(
        'SELECT id FROM plano_contas WHERE status = "Ativo" LIMIT 1'
      );
      let planoContaId = 1; // Plano de conta padrão se não houver nenhum
      if ((planoContaRows as Array<{ id: number }>).length > 0) {
        planoContaId = (planoContaRows as Array<{ id: number }>)[0].id;
      }
      let usuarioId = 'admin'; // Usuário padrão se não houver nenhum
      try {
        const [usuarioRows] = await accessPool.execute(
          'SELECT login FROM usuarios WHERE status = "Ativo" LIMIT 1'
        );
        if ((usuarioRows as Array<{ login: string }>).length > 0) {
          usuarioId = (usuarioRows as Array<{ login: string }>)[0].login;
        }
      } catch {
      }
      const descricao = `Agendamento - ${clienteNome} - ${procedimentoNome}`;
      const dataAtual = getCurrentUTCISO();
      await executeWithRetry(accessPool,
        `INSERT INTO lancamentos (
          valor, descricao, data_lancamento, tipo, forma_pagamento,
          status_pagamento, cliente_id, plano_conta_id, caixa_id,
          agenda_id, usuario_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          null, // valor como null
          descricao,
          dataAtual, // data atual em UTC ISO
          'ENTRADA', // tipo ENTRADA
          null, // forma_pagamento como null
          'PENDENTE', // status_pagamento PENDENTE
          payload.cliente_id,
          planoContaId,
          caixaId,
          agendaId, // agenda_id da agenda criada
          usuarioId, // usuario_id da sessão
          'Ativo'
        ]
      );
    } catch (lancamentoError) {
    }
    console.log("✅ [AGENDA POST] Agenda criada com sucesso, ID:", agendaId);
    return NextResponse.json({ 
      success: true, 
      id: agendaId 
    });
  } catch (error) {
    console.error("❌ [AGENDA POST] Erro detalhado:", error);
    console.error("❌ [AGENDA POST] Stack trace:", error instanceof Error ? error.stack : 'Sem stack trace');
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? {
          message: error instanceof Error ? error.message : 'Erro desconhecido',
          stack: error instanceof Error ? error.stack : null
        } : undefined
      },
      { status: 500 }
    );
  }
}
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
    const body = await request.json();
    const validatedData = updateAgendaSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }
    const { ...payload } = validatedData.data;
    await executeWithRetry(accessPool,
      `UPDATE agendas SET 
        dtagenda = ?, situacao = ?, cliente_id = ?, convenio_id = ?,
        procedimento_id = ?, expediente_id = ?, prestador_id = ?,
        unidade_id = ?, especialidade_id = ?, tipo = ?, tipo_cliente = ?
       WHERE id = ?`,
      [
        payload.dtagenda, payload.situacao, payload.cliente_id, payload.convenio_id,
        payload.procedimento_id, payload.expediente_id || null, payload.prestador_id,
        payload.unidade_id, payload.especialidade_id, payload.tipo, payload.tipo_cliente, id
      ]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
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
    await executeWithRetry(accessPool,
      'UPDATE agendas SET situacao = "Cancelado" WHERE id = ?',
      [id]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}