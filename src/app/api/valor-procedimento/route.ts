import { NextRequest, NextResponse } from "next/server";
import { accessPool, executeWithRetry } from "@/lib/mysql";
import { z } from "zod";
import { createValorProcedimentoSchema, updateValorProcedimentoSchema } from "./schema/formSchemaValorProcedimento";
export type CreateValorProcedimentoDTO = z.infer<typeof createValorProcedimentoSchema>;
export type UpdateValorProcedimentoDTO = z.infer<typeof updateValorProcedimentoSchema>;
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const limit = searchParams.get("limit") || "10";
    const search = searchParams.get("search") || "";
    const convenio_id = searchParams.get("convenio_id");
    const tipoCliente = searchParams.get("tipoCliente");
    const tabela_faturamento_id = searchParams.get("tabela_faturamento_id");
    const procedimento_id = searchParams.get("procedimento_id");
    const valor = searchParams.get("valor");
    const conveniosId = searchParams.get("conveniosId"); // Para compatibilidade
    const convenioId = convenio_id || conveniosId;
    
    console.log('🔍 [API VALOR-PROCEDIMENTO] Parâmetros recebidos:', {
      convenio_id,
      conveniosId, 
      convenioId,
      tipoCliente,
      tabela_faturamento_id,
      procedimento_id,
      valor
    });
    
    if (convenioId && tipoCliente) {
      const query = `
        SELECT DISTINCT vp.*, p.nome as procedimento_nome, p.codigo as procedimento_codigo
        FROM valor_procedimentos vp
        INNER JOIN procedimentos p ON vp.procedimento_id = p.id
        INNER JOIN tabela_faturamentos tf ON vp.tabela_faturamento_id = tf.id
        INNER JOIN convenios c ON tf.id = c.tabela_faturamento_id
        WHERE c.id = ? AND vp.tipo = ?
        ORDER BY p.nome ASC
      `;
      
      console.log('📊 [API VALOR-PROCEDIMENTO] Executando query:', {
        query: query.trim(),
        parametros: [convenioId, tipoCliente]
      });
      
      const valorRows = await executeWithRetry(accessPool, query, [convenioId, tipoCliente]);
      console.log('📈 [API VALOR-PROCEDIMENTO] Quantidade de registros retornados:', (valorRows as any[]).length);
      const valorProcedimentosFormatados = (valorRows as Array<{
        id: number;
        valor: number;
        tipo: string;
        tabela_faturamento_id: number;
        procedimento_id: number;
        procedimento_nome: string;
        procedimento_codigo: string;
      }>).map(row => ({
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
      const dadosValidos = valorProcedimentosFormatados.filter(item => 
        item && item.id && item.procedimento && item.procedimento.nome
      );
      
      console.log('✅ [API VALOR-PROCEDIMENTO] Dados válidos após filtro:', dadosValidos.length);
      console.log('📋 [API VALOR-PROCEDIMENTO] Primeiros 3 procedimentos:', 
        dadosValidos.slice(0, 3).map(item => ({
          id: item.id,
          nome: item.procedimento.nome,
          valor: item.valor,
          tipo: item.tipo
        }))
      );
      
      return NextResponse.json(dadosValidos);
    }
    
    // Sempre incluir JOIN com convenios se convenioId for fornecido
    let extraJoin = "";
    if (convenioId) {
      extraJoin = "INNER JOIN convenios c ON tf.id = c.tabela_faturamento_id";
    }
    
    const baseQuery = `
      FROM valor_procedimentos vp
      INNER JOIN procedimentos p ON vp.procedimento_id = p.id
      INNER JOIN tabela_faturamentos tf ON vp.tabela_faturamento_id = tf.id
      ${extraJoin}
    `;
    const whereClauses: string[] = [];
    const params: (string | number)[] = [];
    
    // Construir condições WHERE
    const conditions: string[] = [];
    
    // Filtro por convênio (se fornecido)
    if (convenioId) {
      conditions.push("c.id = ?");
      params.push(convenioId);
    }
    
    // Filtro por tipo cliente (se fornecido)
    if (tipoCliente) {
      conditions.push("vp.tipo = ?");
      params.push(tipoCliente);
    }
    
    // Filtro por tabela faturamento (se fornecido)
    if (tabela_faturamento_id) {
      conditions.push("vp.tabela_faturamento_id = ?");
      params.push(parseInt(tabela_faturamento_id));
    }
    
    // Filtro por procedimento (se fornecido)
    if (procedimento_id) {
      conditions.push("vp.procedimento_id = ?");
      params.push(parseInt(procedimento_id));
    }
    
    // Filtro por valor (se fornecido)
    if (valor) {
      conditions.push("vp.valor = ?");
      params.push(parseFloat(valor));
    }
    
    // Filtro de busca (se fornecido)  
    if (search) {
      conditions.push("(p.nome LIKE ? OR vp.tipo LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // Construir string WHERE
    if (conditions.length > 0) {
      whereClauses.push("WHERE " + conditions.join(" AND "));
    } else {
      whereClauses.push("WHERE 1=1");
    }
    const whereString = whereClauses.join(" ");
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const dataQuery = `
      SELECT vp.*, p.nome as procedimento_nome, p.codigo as procedimento_codigo
      ${baseQuery}
      ${whereString}
      ORDER BY vp.id DESC
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `;
    const dataParams = [
      ...params,
      parseInt(limit),
      (parseInt(page) - 1) * parseInt(limit),
    ];
    const valorRows = await executeWithRetry(accessPool, dataQuery, dataParams);
    const valorProcedimentosFormatados = (valorRows as Array<{
      id: number;
      valor: number;
      tipo: string;
      tabela_faturamento_id: number;
      procedimento_id: number;
      procedimento_nome: string;
      procedimento_codigo: string;
    }>).map(row => ({
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
    const dadosValidos = valorProcedimentosFormatados.filter(item => 
      item && item.id && item.procedimento && item.procedimento.nome
    );
    const countQuery = `SELECT COUNT(vp.id) as total ${baseQuery} ${whereString}`;
    await executeWithRetry(accessPool, countQuery, params);
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
    console.error('❌ [API VALOR-PROCEDIMENTO] Erro:', error);
    console.error('💥 [API VALOR-PROCEDIMENTO] Stack trace:', error instanceof Error ? error.stack : 'Sem stack trace');
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const body: CreateValorProcedimentoDTO = await request.json();
    const [result] = await accessPool.execute(
      `INSERT INTO valor_procedimentos (
        valor, tipo, tabela_faturamento_id, procedimento_id
      ) VALUES (?, ?, ?, ?)`,
      [
        body.valor, body.tipo, body.tabela_faturamento_id, body.procedimento_id
      ]
    );
    return NextResponse.json({ 
      success: true, 
      id: (result as { insertId: number }).insertId 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
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
    if (body.delete === true) {
      await accessPool.execute(
        'DELETE FROM valor_procedimentos WHERE id = ?',
        [id]
      );
      return NextResponse.json({ success: true, message: 'Valor de procedimento removido com sucesso' });
    }
    if (body.valor !== undefined || body.tipo !== undefined || 
        body.tabela_faturamento_id !== undefined || body.procedimento_id !== undefined) {
      const updateFields: string[] = [];
      const updateValues: (string | number)[] = [];
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
      await accessPool.execute(updateQuery, updateValues);
      return NextResponse.json({ success: true, message: 'Valor de procedimento atualizado com sucesso' });
    }
    return NextResponse.json(
      { error: 'Nenhum campo para atualizar fornecido' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 