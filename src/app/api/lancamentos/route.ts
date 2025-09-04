import { NextRequest, NextResponse } from "next/server";
import { gestorPool, executeWithRetry } from "@/lib/mysql";
import { z } from "zod";
import { createLancamentoSchema, updateLancamentoSchema } from "./schema/formSchemeLancamentos";

export type CreateLancamentoDTO = z.infer<typeof createLancamentoSchema>;
export type UpdateLancamentoDTO = z.infer<typeof updateLancamentoSchema>;

// GET - Listar lançamentos com paginação e busca
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';
    const caixa_id = searchParams.get('caixa_id');
    const plano_conta_id = searchParams.get('plano_conta_id');
    const data_inicio = searchParams.get('data_inicio');
    const data_fim = searchParams.get('data_fim');

    // Primeiro, buscar os lançamentos do banco gestor
    let query = `
      SELECT 
        l.*,
        c.nome as caixa_nome,
        pc.nome as plano_conta_nome,
        cl.nome as cliente_nome
      FROM lancamentos l
      LEFT JOIN caixas c ON l.caixa_id = c.id
      LEFT JOIN plano_contas pc ON l.plano_conta_id = pc.id
      LEFT JOIN clientes cl ON l.cliente_id = cl.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (search) {
      query += ' AND (l.descricao LIKE ? OR l.tipo LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (caixa_id) {
      query += ' AND l.caixa_id = ?';
      params.push(parseInt(caixa_id));
    }

    if (plano_conta_id) {
      query += ' AND l.plano_conta_id = ?';
      params.push(parseInt(plano_conta_id));
    }

    if (data_inicio && data_fim) {
      query += ' AND DATE(l.data_lancamento) BETWEEN ? AND ?';
      params.push(data_inicio, data_fim);
    }

    // Adicionar paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY l.data_lancamento DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const lancamentoRows = await executeWithRetry(gestorPool, query, params);

    // Agora buscar os nomes dos usuários do banco cpsi_acesso
    const lancamentosComUsuarios = await Promise.all(
      (lancamentoRows as Array<{
        id: number;
        descricao: string;
        valor: number;
        tipo: string;
        data_lancamento: string;
        caixa_id: number;
        plano_conta_id: number;
        usuario_id: number;
        createdAt: Date;
        updatedAt: Date;
      }>).map(async (lancamento) => {
        try {
          if (lancamento.usuario_id) {
            const [userRows] = await gestorPool.execute(
              'SELECT nome FROM usuarios WHERE login = ? AND status = "Ativo"',
              [lancamento.usuario_id]
            );
            const usuario = (userRows as Array<{ nome: string }>)[0];
            return {
              ...lancamento,
              usuario_nome: usuario ? usuario.nome : 'Usuário não encontrado'
            };
          }
          return {
            ...lancamento,
            usuario_nome: 'Usuário não informado'
          };
        } catch (error) {
          console.error('Erro ao buscar usuário:', error);
          return {
            ...lancamento,
            usuario_nome: 'Erro ao buscar usuário'
          };
        }
      })
    );

    // Buscar total de registros para paginação
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM lancamentos l
      WHERE 1=1
    `;
    const countParams: (string | number)[] = [];

    if (search) {
      countQuery += ' AND (l.descricao LIKE ? OR l.tipo LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (caixa_id) {
      countQuery += ' AND l.caixa_id = ?';
      countParams.push(parseInt(caixa_id));
    }

    if (plano_conta_id) {
      countQuery += ' AND l.plano_conta_id = ?';
      countParams.push(parseInt(plano_conta_id));
    }

    if (data_inicio && data_fim) {
      countQuery += ' AND DATE(l.data_lancamento) BETWEEN ? AND ?';
      countParams.push(data_inicio, data_fim);
    }

    const countRows = await executeWithRetry(gestorPool, countQuery, countParams);
    const total = (countRows as Array<{ total: number }>)[0]?.total || 0;

    return NextResponse.json({
      data: lancamentosComUsuarios,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar lançamentos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar lançamento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createLancamentoSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    const { ...payload } = validatedData.data;

    // Debug logs removidos para evitar spam

    // Debug logs removidos para evitar spam

    // Verificar se o usuário existe no banco cpsi_acesso
    try {
      const [userRows] = await gestorPool.execute(
        'SELECT login, nome FROM usuarios WHERE login = ? AND status = "Ativo"',
        [payload.usuario_id]
      );
      console.log('🔍 Debug - Usuário encontrado:', userRows);
      
      if ((userRows as Array<{ login: string; nome: string }>).length === 0) {
        return NextResponse.json(
          { error: 'Usuário não encontrado ou inativo' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('🔍 Debug - Erro ao verificar usuário:', error);
      return NextResponse.json(
        { error: 'Erro ao verificar usuário' },
        { status: 500 }
      );
    }

    // Inserir lançamento com campos corretos
    const result = await executeWithRetry(gestorPool,
      `INSERT INTO lancamentos (
        valor, descricao, data_lancamento, tipo, forma_pagamento,
        status_pagamento, cliente_id, plano_conta_id, caixa_id,
        usuario_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.valor, payload.descricao, payload.data_lancamento, payload.tipo,
        payload.forma_pagamento, payload.status_pagamento, payload.cliente_id,
        payload.plano_conta_id, payload.caixa_id, payload.usuario_id, 'Ativo'
      ]
    );

    return NextResponse.json({ 
      success: true, 
      id: (result as { insertId: number }).insertId 
    });
  } catch (error) {
    console.error('Erro ao criar lançamento:', error);
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

// PUT - Atualizar lançamento
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do lançamento é obrigatório' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateLancamentoSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    const { ...payload } = validatedData.data;

    // Atualizar lançamento com campos corretos
    await executeWithRetry(gestorPool,
      `UPDATE lancamentos SET 
        valor = ?, descricao = ?, tipo = ?, data_lancamento = ?,
        forma_pagamento = ?, status_pagamento = ?, cliente_id = ?,
        plano_conta_id = ?, caixa_id = ?, usuario_id = ?
       WHERE id = ?`,
      [
        payload.valor, payload.descricao, payload.tipo, payload.data_lancamento,
        payload.forma_pagamento, payload.status_pagamento, payload.cliente_id,
        payload.plano_conta_id, payload.caixa_id, payload.usuario_id, id
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar lançamento:', error);
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

// DELETE - Deletar lançamento
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do lançamento é obrigatório' },
        { status: 400 }
      );
    }

    // Soft delete - marcar como inativo
    await executeWithRetry(gestorPool,
      'UPDATE lancamentos SET status = "Inativo" WHERE id = ?',
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar lançamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}