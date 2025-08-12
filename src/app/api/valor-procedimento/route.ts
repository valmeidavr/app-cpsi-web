import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";
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

    // 1. Defina a base da query com o JOIN para que sempre busque o nome do procedimento.
    const baseQuery = `
      FROM valor_procedimentos vp
      INNER JOIN procedimentos p ON vp.procedimentos_id = p.id
      INNER JOIN tabela_faturamentos tf ON vp.tabela_faturamentos_id = tf.id
    `;

    const whereClauses: string[] = [];
    const params: (string | number)[] = [];

    // 2. Adicione as condições WHERE dinamicamente.
    if (convenio_id && tipoCliente) {
      // Adiciona o JOIN com convênios apenas quando necessário
      const queryPart = `
        INNER JOIN convenios c ON tf.id = c.tabela_faturamentos_id
        WHERE c.id = ? AND vp.tipo = ?
      `;
      whereClauses.push(queryPart);
      params.push(convenio_id, tipoCliente);
    } else if (search) {
      whereClauses.push("WHERE p.nome LIKE ? OR vp.tipo LIKE ?");
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereString = whereClauses.join(" ");

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
    const [valorRows] = await gestorPool.execute(dataQuery, dataParams);

    // 4. Monte a query para contar o total de registros (sem repetir código).
    const countQuery = `SELECT COUNT(vp.id) as total ${baseQuery} ${whereString}`;
    const [countRows] = await gestorPool.execute(countQuery, params);
    const total = (countRows as any[])[0]?.total || 0;

    // Se for busca por convênio, o comportamento antigo de retornar só os dados pode ser mantido
    if (convenio_id && tipoCliente) {
      return NextResponse.json(valorRows);
    }

    return NextResponse.json({
      data: valorRows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
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
        valor, tipo, tabela_faturamentos_id, procedimentos_id
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