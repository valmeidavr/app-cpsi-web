import { NextRequest, NextResponse } from "next/server";
import { gestorPool, executeWithRetry } from "@/lib/mysql";
import { z } from "zod";
import { createValorProcedimentoSchema, updateValorProcedimentoSchema } from "./schema/formSchemaValorProcedimento";

export type CreateValorProcedimentoDTO = z.infer<typeof createValorProcedimentoSchema>;
export type UpdateValorProcedimentoDTO = z.infer<typeof updateValorProcedimentoSchema>;

// GET - Listar valores de procedimentos com paginação e busca
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";
    const search = searchParams.get("search") || "";
    const convenio_id = searchParams.get("convenio_id");
    const tipoCliente = searchParams.get("tipoCliente");
    const conveniosId = searchParams.get("conveniosId"); // Para compatibilidade
    const convenioId = convenio_id || conveniosId;

    // Se for busca específica por convênio e tipo de cliente
    if (convenioId && tipoCliente) {
      const query = `
        SELECT DISTINCT vp.*, p.nome as procedimento_nome, p.codigo as procedimento_codigo
        FROM valor_procedimentos vp
        INNER JOIN procedimentos p ON vp.procedimento_id = p.id
        INNER JOIN tabela_faturamentos tf ON vp.tabela_faturamento_id = tf.id
        INNER JOIN convenios c ON tf.id = c.tabelaFaturamentosId
        WHERE c.id = ? AND vp.tipo = ?
        ORDER BY p.nome ASC
      `;
      
      const valorRows = await executeWithRetry(gestorPool, query, [convenioId, tipoCliente]);
      
      // Transformar os dados para o formato esperado pelo frontend
      const valorProcedimentosFormatados = (valorRows as any[]).map(row => ({
        id: row.id,
        valor: row.valor,
        tipo: row.tipo,
        status: 'Ativo', // Valor padrão já que a coluna não existe
        tabela_faturamento_id: row.tabela_faturamento_id,
        procedimento_id: row.procedimento_id,
        procedimento: {
          id: row.procedimento_id,
          nome: row.procedimento_nome || 'N/A',
          codigo: row.procedimento_codigo || 'N/A'
        },
        tabelaFaturamento: {
          id: row.tabela_faturamento_id
        }
      }));
      
      // Verificar se os dados são válidos
      const dadosValidos = valorProcedimentosFormatados.filter(item => 
        item && item.id && item.procedimento && item.procedimento.nome
      );
      
      return NextResponse.json(dadosValidos);
    }

    // 1. Defina a base da query com o JOIN para que sempre busque o nome do procedimento.
    const baseQuery = `
      FROM valor_procedimentos vp
      INNER JOIN procedimentos p ON vp.procedimento_id = p.id
      INNER JOIN tabela_faturamentos tf ON vp.tabela_faturamento_id = tf.id
    `;

    const whereClauses: string[] = [];
    const params: (string | number)[] = [];

    // 2. Adicione as condições WHERE dinamicamente.
    if (search) {
      whereClauses.push("WHERE (p.nome LIKE ? OR vp.tipo LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    } else {
      whereClauses.push("WHERE 1=1"); // Sem filtros específicos
    }

    const whereString = whereClauses.join(" ");
    
    // Debug logs removidos para evitar spam

    // 3. Monte a query para buscar os dados.
    const dataQuery = `
      SELECT vp.*, p.nome as procedimento_nome, p.codigo as procedimento_codigo
      ${baseQuery}
      ${whereString}
      ORDER BY vp.id DESC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [
      ...params,
      parseInt(limit),
      (parseInt(page) - 1) * parseInt(limit),
    ];
    const valorRows = await executeWithRetry(gestorPool, dataQuery, dataParams);

    // 4. Transformar os dados para o formato esperado pelo frontend
    const valorProcedimentosFormatados = (valorRows as any[]).map(row => ({
      id: row.id,
      valor: row.valor,
      tipo: row.tipo,
      status: 'Ativo', // Valor padrão já que a coluna não existe
      tabela_faturamento_id: row.tabela_faturamento_id,
      procedimento_id: row.procedimento_id,
      procedimento: {
        id: row.procedimento_id,
        nome: row.procedimento_nome || 'N/A',
        codigo: row.procedimento_codigo || 'N/A'
      },
      tabelaFaturamento: {
        id: row.tabela_faturamento_id
      }
    }));
    
    // Debug logs removidos para evitar spam

    // 5. Verificar se os dados são válidos
    const dadosValidos = valorProcedimentosFormatados.filter(item => 
      item && item.id && item.procedimento && item.procedimento.nome
    );

    // 6. Monte a query para contar o total de registros (sem repetir código).
    const countQuery = `SELECT COUNT(vp.id) as total ${baseQuery} ${whereString}`;
    const countRows = await executeWithRetry(gestorPool, countQuery, params);
    const total = (countRows as any[])[0]?.total || 0;
    
    // Debug logs removidos para evitar spam

    return NextResponse.json({
      data: dadosValidos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: dadosValidos.length,
        totalPages: Math.ceil(dadosValidos.length / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar valores de procedimentos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST - Criar valor de procedimento
export async function POST(request: NextRequest) {
  try {
    const body: CreateValorProcedimentoDTO = await request.json();

    // Inserir valor de procedimento
    const [result] = await gestorPool.execute(
      `INSERT INTO valor_procedimentos (
        valor, tipo, tabela_faturamento_id, procedimento_id
      ) VALUES (?, ?, ?, ?)`,
      [
        body.valor, body.tipo, body.tabela_faturamento_id, body.procedimento_id
      ]
    );

    return NextResponse.json({ 
      success: true, 
      id: (result as any).insertId 
    });
  } catch (error) {
    console.error('Erro ao criar valor de procedimento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar ou deletar valor de procedimento
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }

    // Se for para deletar (remover o registro)
    if (body.delete === true) {
      await gestorPool.execute(
        'DELETE FROM valor_procedimentos WHERE id = ?',
        [id]
      );
      return NextResponse.json({ success: true, message: 'Valor de procedimento removido com sucesso' });
    }

    // Se for para atualizar
    if (body.valor !== undefined || body.tipo !== undefined || 
        body.tabela_faturamento_id !== undefined || body.procedimento_id !== undefined) {
      
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (body.valor !== undefined) {
        updateFields.push('valor = ?');
        updateValues.push(body.valor);
      }
      if (body.tipo !== undefined) {
        updateFields.push('tipo = ?');
        updateValues.push(body.tipo);
      }
      if (body.tabela_faturamento_id !== undefined) {
        updateFields.push('tabela_faturamento_id = ?');
        updateValues.push(body.tabela_faturamento_id);
      }
      if (body.procedimento_id !== undefined) {
        updateFields.push('procedimento_id = ?');
        updateValues.push(body.procedimento_id);
      }

      updateValues.push(id);
      const updateQuery = `UPDATE valor_procedimentos SET ${updateFields.join(', ')} WHERE id = ?`;
      
      await gestorPool.execute(updateQuery, updateValues);
      return NextResponse.json({ success: true, message: 'Valor de procedimento atualizado com sucesso' });
    }

    return NextResponse.json(
      { error: 'Nenhum campo para atualizar fornecido' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Erro ao atualizar/deletar valor de procedimento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 