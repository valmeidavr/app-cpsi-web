import { NextRequest, NextResponse } from "next/server";
import { gestorPool, executeWithRetry } from "@/lib/mysql";
import { z } from "zod";
import { createAgendaSchema, updateAgendaSchema } from "./schema/formSchemaAgendas";
import { getCurrentUTCISO } from "@/app/helpers/dateUtils";

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

    // Debug logs removidos para evitar spam

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

    // Debug logs removidos para evitar spam

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

    // Debug: log da query de contagem
    const countRows = await executeWithRetry(gestorPool, countQuery, countParams);
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
    const body = await request.json();
    const validatedData = createAgendaSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    const { ...payload } = validatedData.data;

    // Inserir agenda
    const result = await executeWithRetry(gestorPool,
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

    const agendaId = (result as { insertId: number }).insertId;

    // Criar automaticamente um lançamento de caixa para o agendamento
    try {
      // Buscar informações do cliente para a descrição
      let clienteNome = 'Cliente não informado';
      if (payload.cliente_id) {
        const [clienteRows] = await gestorPool.execute(
          'SELECT nome FROM clientes WHERE id = ?',
          [payload.cliente_id]
        );
        if ((clienteRows as Array<{ nome: string }>).length > 0) {
          clienteNome = (clienteRows as Array<{ nome: string }>)[0].nome;
        }
      }

      // Buscar informações do procedimento para a descrição
      let procedimentoNome = 'Procedimento não informado';
      if (payload.procedimento_id) {
        const [procedimentoRows] = await gestorPool.execute(
          'SELECT nome FROM procedimentos WHERE id = ?',
          [payload.procedimento_id]
        );
        if ((procedimentoRows as Array<{ nome: string }>).length > 0) {
          procedimentoNome = (procedimentoRows as Array<{ nome: string }>)[0].nome;
        }
      }

      // Buscar o primeiro caixa ativo disponível
      const [caixaRows] = await gestorPool.execute(
        'SELECT id FROM caixas WHERE status = "Ativo" LIMIT 1'
      );
      
      let caixaId = 1; // Caixa padrão se não houver nenhum
      if ((caixaRows as Array<{ id: number }>).length > 0) {
        caixaId = (caixaRows as Array<{ id: number }>)[0].id;
      }

      // Buscar o primeiro plano de conta ativo disponível
      const [planoContaRows] = await gestorPool.execute(
        'SELECT id FROM plano_contas WHERE status = "Ativo" LIMIT 1'
      );
      
      let planoContaId = 1; // Plano de conta padrão se não houver nenhum
      if ((planoContaRows as Array<{ id: number }>).length > 0) {
        planoContaId = (planoContaRows as Array<{ id: number }>)[0].id;
      }

      // Buscar o primeiro usuário ativo disponível (usuário da sessão)
      let usuarioId = 'admin'; // Usuário padrão se não houver nenhum
      try {
        const [usuarioRows] = await gestorPool.execute(
          'SELECT login FROM usuarios WHERE status = "Ativo" LIMIT 1'
        );
        if ((usuarioRows as Array<{ login: string }>).length > 0) {
          usuarioId = (usuarioRows as Array<{ login: string }>)[0].login;
        }
      } catch {
        // Usando usuário padrão
      }

      // Criar o lançamento
      const descricao = `Agendamento - ${clienteNome} - ${procedimentoNome}`;
      const dataAtual = getCurrentUTCISO();

      await executeWithRetry(gestorPool,
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

      // Lançamento criado automaticamente
    } catch (lancamentoError) {
      console.error('⚠️ Erro ao criar lançamento automático:', lancamentoError);
      // Não falhar a criação da agenda por causa do lançamento
      // O agendamento foi criado com sucesso
    }

    return NextResponse.json({ 
      success: true, 
      id: agendaId 
    });
  } catch (error) {
    console.error('Erro ao criar agenda:', error);
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

    const body = await request.json();
    const validatedData = updateAgendaSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    const { ...payload } = validatedData.data;

    // Atualizar agenda
    await executeWithRetry(gestorPool,
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
    console.error('Erro ao atualizar agenda:', error);
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

    // Soft delete - marcar como cancelado
    await executeWithRetry(gestorPool,
      'UPDATE agendas SET situacao = "Cancelado" WHERE id = ?',
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