import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";

// GET - Buscar convenio por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const [rows] = await gestorPool.execute(
      'SELECT * FROM convenios WHERE id = ?',
      [id]
    );

    if ((rows as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Convênio não encontrado' },
        { status: 404 }
      );
    }

    const convenio = (rows as any[])[0];

    return NextResponse.json(convenio);
  } catch (error) {
    console.error('Erro ao buscar convenio:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar convenio
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();

    // Validar campos obrigatórios
    if (!body.nome || !body.regras || body.tabela_faturamento_id === undefined) {
      return NextResponse.json(
        { error: 'Campos obrigatórios não preenchidos' },
        { status: 400 }
      );
    }

    // Garantir que desconto seja um número válido
    const desconto = body.desconto !== undefined ? Number(body.desconto) : 0;

    // Atualizar convenio
    await gestorPool.execute(
      `UPDATE convenios SET 
        nome = ?, desconto = ?, regras = ?, tabelaFaturamentosId = ?
       WHERE id = ?`,
      [body.nome, desconto, body.regras, body.tabela_faturamento_id, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar convenio:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 