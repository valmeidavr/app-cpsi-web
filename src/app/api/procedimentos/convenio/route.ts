import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const convenio_id = searchParams.get("convenio_id");
    const tipoCliente = searchParams.get("tipoCliente");
    if (!convenio_id || !tipoCliente) {
      return NextResponse.json(
        { error: "convênio_id e tipoCliente são obrigatórios" },
        { status: 400 }
      );
    }
    const query = `
      SELECT DISTINCT p.id, p.nome, p.codigo, p.tipo, p.especialidade_id
      FROM procedimentos p
      INNER JOIN valor_procedimentos vp ON p.id = vp.procedimento_id
      INNER JOIN tabela_faturamentos tf ON vp.tabela_faturamento_id = tf.id
      INNER JOIN convenios c ON tf.id = c.tabela_faturamento_id
      WHERE c.id = ? AND vp.tipo = ? AND p.status = 'Ativo'
      ORDER BY p.nome ASC
    `;
    const [procedimentoRows] = await accessPool.execute(query, [convenio_id, tipoCliente]);
    return NextResponse.json({
      data: procedimentoRows,
      success: true
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}