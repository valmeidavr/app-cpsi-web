import { NextRequest, NextResponse } from "next/server";
import { accessPool, executeWithRetry } from "@/lib/mysql";
import { z } from "zod";
import { createLancamentoSchema, updateLancamentoSchema } from "./schema/formSchemeLancamentos";
export type CreateLancamentoDTO = z.infer<typeof createLancamentoSchema>;
export type UpdateLancamentoDTO = z.infer<typeof updateLancamentoSchema>;
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
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY l.data_lancamento DESC LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    const lancamentoRows = await executeWithRetry(accessPool, query, params);
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
            const [userRows] = await accessPool.execute(
              'SELECT nome FROM usuarios WHERE login = ?',
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
          return {
            ...lancamento,
            usuario_nome: 'Erro ao buscar usuário'
          };
        }
      })
    );
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
    const countRows = await executeWithRetry(accessPool, countQuery, countParams);
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
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
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
    let usuarioId = payload.usuario_id;
    if (usuarioId && usuarioId !== "0") {
      try {
        const [userRows] = await accessPool.execute(
          'SELECT id, nome FROM usuarios WHERE id = ? AND status = "Ativo"',
          [parseInt(usuarioId)]
        );
        if ((userRows as Array<{ id: number; nome: string }>).length === 0) {
          return NextResponse.json(
            { error: 'Usuário não encontrado ou inativo' },
            { status: 400 }
          );
        }
        usuarioId = parseInt(usuarioId);
      } catch (error) {
        return NextResponse.json(
          { error: 'Erro ao verificar usuário' },
          { status: 500 }
        );
      }
    } else {
      usuarioId = null;
    }
    const [planoContaRows] = await accessPool.execute(
      'SELECT tipo FROM plano_contas WHERE id = ?',
      [payload.plano_conta_id]
    );
    const planoConta = (planoContaRows as Array<{ tipo: string }>)[0];
    if (!planoConta) {
      return NextResponse.json(
        { error: 'Plano de conta não encontrado' },
        { status: 400 }
      );
    }
    const result = await executeWithRetry(accessPool,
      `INSERT INTO lancamentos (
        valor, descricao, data_lancamento, tipo, forma_pagamento,
        status_pagamento, cliente_id, plano_conta_id, caixa_id,
        usuario_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.valor, payload.descricao, payload.data_lancamento, planoConta.tipo,
        payload.forma_pagamento, payload.status_pagamento, payload.cliente_id,
        payload.plano_conta_id, payload.caixa_id, usuarioId, 'Ativo'
      ]
    );
    return NextResponse.json({ 
      success: true, 
      id: (result as { insertId: number }).insertId 
    });
  } catch (error) {
    console.error('Erro ao salvar lançamento:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
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
    await executeWithRetry(accessPool,
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
        { error: 'ID do lançamento é obrigatório' },
        { status: 400 }
      );
    }
    await executeWithRetry(accessPool,
      'UPDATE lancamentos SET status = "Inativo" WHERE id = ?',
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