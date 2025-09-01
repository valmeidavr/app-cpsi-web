import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";

// GET - Buscar lancamento por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [rows] = await gestorPool.execute(
      'SELECT * FROM lancamentos WHERE id = ?',
      [id]
    );

    if ((rows as Array<{
      id: number;
      descricao: string;
      valor: number;
      data_lancamento: string;
      forma_pagamento: string;
      status_pagamento: string;
      clientes_id: number;
      plano_contas_id: number;
      caixas_id: number;
      usuario_id: number;
      createdAt: Date;
      updatedAt: Date;
    }>).length === 0) {
      return NextResponse.json(
        { error: 'Lançamento não encontrado' },
        { status: 404 }
      );
    }

    const lancamento = (rows as Array<{
      id: number;
      descricao: string;
      valor: number;
      data_lancamento: string;
      forma_pagamento: string;
      status_pagamento: string;
      clientes_id: number;
      plano_contas_id: number;
      caixas_id: number;
      usuario_id: number;
      createdAt: Date;
      updatedAt: Date;
    }>)[0];

    return NextResponse.json(lancamento);
  } catch (error) {
    console.error('Erro ao buscar lancamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar lancamento
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Atualizar lancamento
    await gestorPool.execute(
      `UPDATE lancamentos SET 
        descricao = ?, valor = ?, data_lancamento = ?, forma_pagamento = ?, 
        status_pagamento = ?, clientes_id = ?, plano_contas_id = ?, caixas_id = ?, usuario_id = ?
       WHERE id = ?`,
      [
        body.descricao, body.valor, body.data_lancamento, body.forma_pagamento,
        body.status_pagamento, body.clientes_id, body.plano_contas_id, body.caixas_id, body.usuario_id, id
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar lancamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 