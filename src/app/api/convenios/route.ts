import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";
import { z } from "zod";
import { createConvenioSchema, updateConvenioSchema } from "./schema/formSchemaConvenios";

export type CreateConvenioDTO = z.infer<typeof createConvenioSchema>;
export type UpdateConvenioDTO = z.infer<typeof updateConvenioSchema>;

// GET - Listar convênios com paginação e busca
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';

    let query = 'SELECT id, nome, desconto, regras, tabelaFaturamentosId as tabela_faturamento_id FROM convenios';
    const params: (string | number)[] = [];

    if (search) {
      query += ' WHERE (nome LIKE ? OR regras LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Adicionar paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ' ORDER BY nome ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [convenioRows] = await gestorPool.execute(query, params);

    // Buscar total de registros para paginação
    let countQuery = 'SELECT COUNT(*) as total FROM convenios';
    const countParams: (string)[] = [];

    if (search) {
      countQuery += ' WHERE (nome LIKE ? OR regras LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const [countRows] = await gestorPool.execute(countQuery, countParams);
    const total = (countRows as any[])[0]?.total || 0;

    return NextResponse.json({
      data: convenioRows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar convênios:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar convênio
export async function POST(request: NextRequest) {
  try {
    const body: CreateConvenioDTO = await request.json();
    
    console.log("🔍 Dados recebidos para criar convênio:", body);
    console.log("🔍 Tipo do tabela_faturamento_id:", typeof body.tabela_faturamento_id);
    console.log("🔍 Valor do tabela_faturamento_id:", body.tabela_faturamento_id);

    // Validar campos obrigatórios
    if (!body.nome || !body.regras || body.tabela_faturamento_id === undefined) {
      console.log("❌ Validação falhou:", {
        nome: !!body.nome,
        regras: !!body.regras,
        tabela_faturamento_id: body.tabela_faturamento_id
      });
      return NextResponse.json(
        { error: 'Campos obrigatórios não preenchidos' },
        { status: 400 }
      );
    }

    // Garantir que desconto seja um número válido
    const desconto = body.desconto !== undefined ? Number(body.desconto) : 0;

    console.log("🔍 Dados para inserção:", {
      nome: body.nome,
      desconto,
      regras: body.regras,
      tabelaFaturamentosId: body.tabela_faturamento_id
    });

    // Inserir convênio
    const [result] = await gestorPool.execute(
      `INSERT INTO convenios (
        nome, desconto, regras, tabelaFaturamentosId
      ) VALUES (?, ?, ?, ?)`,
      [
        body.nome, desconto, body.regras, body.tabela_faturamento_id
      ]
    );

    console.log("✅ Convênio criado com sucesso:", result);

    return NextResponse.json({ 
      success: true, 
      id: (result as any).insertId 
    });
  } catch (error) {
    console.error('❌ Erro ao criar convênio:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 

// PUT - Atualizar convênio
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do convênio é obrigatório' },
        { status: 400 }
      );
    }

    const body: UpdateConvenioDTO = await request.json();

    // Validar campos obrigatórios
    if (!body.nome || !body.regras || body.tabela_faturamento_id === undefined) {
      return NextResponse.json(
        { error: 'Campos obrigatórios não preenchidos' },
        { status: 400 }
      );
    }

    // Garantir que desconto seja um número válido
    const desconto = body.desconto !== undefined ? Number(body.desconto) : 0;

    // Atualizar convênio
    await gestorPool.execute(
      `UPDATE convenios SET 
        nome = ?, desconto = ?, regras = ?, tabelaFaturamentosId = ?
       WHERE id = ?`,
      [
        body.nome, desconto, body.regras, body.tabela_faturamento_id, id
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar convênio:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar convênio
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do convênio é obrigatório' },
        { status: 400 }
      );
    }

    // DELETE - remover registro
    await gestorPool.execute(
      'DELETE FROM convenios WHERE id = ?',
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar convênio:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 