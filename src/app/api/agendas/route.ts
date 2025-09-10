import { NextRequest, NextResponse } from "next/server";
import { accessPool, executeWithRetry } from "@/lib/mysql";
import { z } from "zod";
import { createAgendaSchema, updateAgendaSchema } from "./schema/formSchemaAgendas";
import { getCurrentUTCISO } from "@/app/helpers/dateUtils";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Função auxiliar para buscar valor do procedimento com desconto do convênio
async function buscarValorProcedimento(procedimentoId: number, tipoCliente: string, convenioId: number) {
  try {
    const [valorRows] = await accessPool.execute(
      `SELECT vp.valor, c.desconto as convenio_desconto
       FROM valor_procedimentos vp
       INNER JOIN tabela_faturamentos tf ON vp.tabela_faturamento_id = tf.id
       INNER JOIN convenios c ON tf.id = c.tabela_faturamento_id
       WHERE vp.procedimento_id = ? AND vp.tipo = ? AND c.id = ?
       LIMIT 1`,
      [procedimentoId, tipoCliente, convenioId]
    );
    
    if ((valorRows as Array<{ valor: number; convenio_desconto: number }>).length > 0) {
      const resultado = (valorRows as Array<{ valor: number; convenio_desconto: number }>)[0];
      const valorOriginal = resultado.valor;
      const descontoConvenio = resultado.convenio_desconto || 0;
      
      // Aplicar desconto se houver
      let valorFinal = valorOriginal;
      if (descontoConvenio > 0) {
        valorFinal = valorOriginal - (valorOriginal * descontoConvenio / 100);
        console.log('💰 [VALOR] Aplicando desconto:', {
          valorOriginal,
          descontoConvenio: `${descontoConvenio}%`,
          valorFinal
        });
      }
      
      return valorFinal;
    }
    return null;
  } catch (error) {
    console.error('❌ Erro ao buscar valor do procedimento:', error);
    return null;
  }
}

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
    
    // Se há uma data específica, buscar todos os agendamentos do dia sem limite
    if (date) {
      query += ` ORDER BY a.dtagenda ASC`;
    } else {
      const offset = (parseInt(page) - 1) * parseInt(limit);
      query += ` ORDER BY c.nome ASC LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    }
    
    const agendaRows = await executeWithRetry(accessPool, query, params);
    
    // Log para debug
    if (date) {
      console.log(`📅 [AGENDA GET] Buscando agendas para data ${date}`);
      console.log(`📊 [AGENDA GET] Total de agendas encontradas: ${(agendaRows as any[]).length}`);
      console.log(`🕐 [AGENDA GET] Primeiros 3 horários:`, (agendaRows as any[]).slice(0, 3).map(r => ({
        id: r.id,
        dtagenda: r.dtagenda,
        situacao: r.situacao,
        cliente: r.cliente_nome
      })));
    }
    
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
    
    // Obter usuário autenticado
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('❌ [AGENDA POST] Usuário não autenticado');
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }
    
    const usuarioAutenticado = session.user.id;
    console.log('👤 [AGENDA POST] Usuário autenticado:', usuarioAutenticado);
    
    const validatedData = createAgendaSchema.safeParse(body);
    if (!validatedData.success) {
      console.error("❌ [AGENDA POST] Validação falhou:", validatedData.error.flatten());
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }
    
    const { ...payload } = validatedData.data;
    
    // Converter formato de data ISO para formato MySQL DATETIME
    if (payload.dtagenda) {
      if (payload.dtagenda.includes('T')) {
        // Se está no formato ISO (2025-09-03T11:00:00.000Z), converter para formato MySQL
        const date = new Date(payload.dtagenda);
        payload.dtagenda = date.toISOString().slice(0, 19).replace('T', ' ');
      }
    }
    
    console.log("✅ [AGENDA POST] Dados validados:", JSON.stringify(payload, null, 2));
    
    // Buscar tipo do cliente cadastrado
    let tipoCliente = 'NSOCIO'; // valor padrão
    if (payload.cliente_id) {
      console.log("🔍 [AGENDA POST] Buscando tipo do cliente no banco");
      const [clienteRows] = await accessPool.execute(
        'SELECT tipo as tipoCliente FROM clientes WHERE id = ?',
        [payload.cliente_id]
      );
      if ((clienteRows as Array<{ tipoCliente: string }>).length > 0) {
        tipoCliente = (clienteRows as Array<{ tipoCliente: string }>)[0].tipoCliente;
        console.log("✅ [AGENDA POST] Tipo do cliente encontrado:", tipoCliente);
      } else {
        console.log("❌ [AGENDA POST] Cliente não encontrado");
        return NextResponse.json(
          { error: "Cliente não encontrado" },
          { status: 400 }
        );
      }
    }
    console.log("💾 [AGENDA POST] Executando INSERT na tabela agendas");
    const result = await executeWithRetry(accessPool,
      `INSERT INTO agendas (
        dtagenda, situacao, cliente_id, convenio_id, procedimento_id,
        expediente_id, prestador_id, unidade_id, especialidade_id, tipo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.dtagenda, payload.situacao, payload.cliente_id, payload.convenio_id,
        payload.procedimento_id, payload.expediente_id || null, payload.prestador_id,
        payload.unidade_id, payload.especialidade_id, payload.tipo
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
      // Buscar valor do procedimento
      const valorProcedimento = await buscarValorProcedimento(
        payload.procedimento_id, 
        tipoCliente, 
        payload.convenio_id
      );
      
      console.log('💰 [AGENDA POST] Valor do procedimento encontrado:', valorProcedimento);
      
      const descricao = `Agendamento - ${clienteNome} - ${procedimentoNome}`;
      const dataAtual = getCurrentUTCISO();
      await executeWithRetry(accessPool,
        `INSERT INTO lancamentos (
          valor, descricao, data_lancamento, tipo, forma_pagamento,
          status_pagamento, cliente_id, plano_conta_id, caixa_id,
          agenda_id, usuario_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          valorProcedimento, // valor real do procedimento
          descricao,
          dataAtual, // data atual em UTC ISO
          'ENTRADA', // tipo ENTRADA
          null, // forma_pagamento como null
          'PENDENTE', // status_pagamento PENDENTE
          payload.cliente_id,
          planoContaId,
          caixaId,
          agendaId, // agenda_id da agenda criada
          usuarioAutenticado, // usuario_id autenticado
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
    console.log("📝 [AGENDA PUT] Iniciando atualização de agenda");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    console.log("🆔 [AGENDA PUT] ID:", id);
    
    if (!id) {
      console.log("❌ [AGENDA PUT] ID não fornecido");
      return NextResponse.json(
        { error: 'ID da agenda é obrigatório' },
        { status: 400 }
      );
    }
    const body = await request.json();
    console.log("📊 [AGENDA PUT] Body recebido:", JSON.stringify(body, null, 2));
    const validatedData = updateAgendaSchema.safeParse(body);
    if (!validatedData.success) {
      console.log("❌ [AGENDA PUT] Validação falhou:", validatedData.error.flatten());
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }
    const { ...payload } = validatedData.data;
    
    // Converter formato de data ISO para formato MySQL DATETIME
    if (payload.dtagenda) {
      if (payload.dtagenda.includes('T')) {
        // Se está no formato ISO (2025-09-03T11:00:00.000Z), converter para formato MySQL
        const date = new Date(payload.dtagenda);
        payload.dtagenda = date.toISOString().slice(0, 19).replace('T', ' ');
      }
    }
    
    console.log("✅ [AGENDA PUT] Dados validados:", JSON.stringify(payload, null, 2));
    
    // Buscar tipo do cliente cadastrado
    let tipoCliente = 'NSOCIO'; // valor padrão
    if (payload.cliente_id) {
      const [clienteRows] = await accessPool.execute(
        'SELECT tipo as tipoCliente FROM clientes WHERE id = ?',
        [payload.cliente_id]
      );
      if ((clienteRows as Array<{ tipoCliente: string }>).length > 0) {
        tipoCliente = (clienteRows as Array<{ tipoCliente: string }>)[0].tipoCliente;
      } else {
        return NextResponse.json(
          { error: "Cliente não encontrado" },
          { status: 400 }
        );
      }
    }
    
    console.log("🔧 [AGENDA PUT] Tipo do cliente final:", tipoCliente);
    console.log("ℹ️ [AGENDA PUT] Nota: tipo_cliente é buscado da tabela clientes, não da agenda");
    
    const updateParams = [
      payload.dtagenda, payload.situacao, payload.cliente_id, payload.convenio_id,
      payload.procedimento_id, payload.expediente_id || null, payload.prestador_id,
      payload.unidade_id, payload.especialidade_id, payload.tipo, id
    ];
    
    console.log("📝 [AGENDA PUT] Parâmetros da query UPDATE:", updateParams);
    console.log("🗄️ [AGENDA PUT] Query SQL:", `UPDATE agendas SET 
      dtagenda = ?, situacao = ?, cliente_id = ?, convenio_id = ?,
      procedimento_id = ?, expediente_id = ?, prestador_id = ?,
      unidade_id = ?, especialidade_id = ?, tipo = ?
     WHERE id = ?`);
    
    await executeWithRetry(accessPool,
      `UPDATE agendas SET 
        dtagenda = ?, situacao = ?, cliente_id = ?, convenio_id = ?,
        procedimento_id = ?, expediente_id = ?, prestador_id = ?,
        unidade_id = ?, especialidade_id = ?, tipo = ?
       WHERE id = ?`,
      [
        payload.dtagenda, payload.situacao, payload.cliente_id, payload.convenio_id,
        payload.procedimento_id, payload.expediente_id || null, payload.prestador_id,
        payload.unidade_id, payload.especialidade_id, payload.tipo, id
      ]
    );
    console.log("✅ [AGENDA PUT] Agenda atualizada com sucesso");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ [AGENDA PUT] Erro detalhado:", error);
    console.error("❌ [AGENDA PUT] Stack trace:", error instanceof Error ? error.stack : 'Sem stack trace');
    console.error("❌ [AGENDA PUT] Tipo do erro:", typeof error);
    console.error("❌ [AGENDA PUT] Nome do erro:", error instanceof Error ? error.name : 'N/A');
    
    // Log específico para erros de SQL
    if (error && typeof error === 'object' && 'code' in error) {
      console.error("❌ [AGENDA PUT] Código SQL:", (error as any).code);
      console.error("❌ [AGENDA PUT] SQL State:", (error as any).sqlState);
      console.error("❌ [AGENDA PUT] SQL Message:", (error as any).sqlMessage);
    }
    
    if (error instanceof z.ZodError) {
      console.error("❌ [AGENDA PUT] Erro de validação Zod:", error.flatten());
      return NextResponse.json(
        { 
          error: "Dados inválidos", 
          details: error.flatten(),
          type: "validation_error"
        },
        { status: 400 }
      );
    }
    
    // Retornar informações mais detalhadas em desenvolvimento
    const errorResponse = {
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      type: 'server_error',
      details: process.env.NODE_ENV === 'development' ? {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : null,
        name: error instanceof Error ? error.name : 'N/A',
        // Informações específicas de erro SQL se disponível
        ...(error && typeof error === 'object' && 'code' in error && {
          sqlCode: (error as any).code,
          sqlState: (error as any).sqlState,
          sqlMessage: (error as any).sqlMessage,
          errno: (error as any).errno
        })
      } : {
        message: 'Erro interno do servidor. Verifique os logs para mais detalhes.'
      }
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ [AGENDA DELETE] Iniciando cancelamento de agenda');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    console.log('🗑️ [AGENDA DELETE] ID recebido:', id);
    
    if (!id) {
      console.log('❌ [AGENDA DELETE] ID não fornecido');
      return NextResponse.json(
        { error: 'ID da agenda é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se a agenda existe
    const [existingRows] = await accessPool.execute(
      'SELECT id, situacao FROM agendas WHERE id = ?',
      [id]
    );

    if ((existingRows as Array<{ id: number; situacao: string }>).length === 0) {
      console.log('❌ [AGENDA DELETE] Agenda não encontrada');
      return NextResponse.json(
        { error: 'Agenda não encontrada' },
        { status: 404 }
      );
    }

    const agenda = (existingRows as Array<{ id: number; situacao: string }>)[0];
    console.log('📊 [AGENDA DELETE] Agenda encontrada, situação atual:', agenda.situacao);

    // Atualizar situação para "INATIVO" (cancelado)
    const result = await executeWithRetry(accessPool,
      'UPDATE agendas SET situacao = ? WHERE id = ?',
      ['INATIVO', id]
    );
    
    console.log('✅ [AGENDA DELETE] Agenda cancelada com sucesso:', result);
    return NextResponse.json({ 
      success: true, 
      message: 'Agendamento cancelado com sucesso',
      oldSituacao: agenda.situacao,
      newSituacao: 'INATIVO'
    });
  } catch (error) {
    console.error('❌ [AGENDA DELETE] Erro ao cancelar agenda:', error);
    console.error('❌ [AGENDA DELETE] Stack trace:', error instanceof Error ? error.stack : 'Sem stack trace');
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? {
          message: error instanceof Error ? error.message : 'Erro desconhecido',
          stack: error instanceof Error ? error.stack : null
        } : undefined
      },
      { status: 500 }
    );
  }
}