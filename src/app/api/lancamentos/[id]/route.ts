import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [rows] = await accessPool.execute(
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
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    await accessPool.execute(
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
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    console.log('🔄 [LANCAMENTOS PATCH] ID:', id);
    console.log('🔄 [LANCAMENTOS PATCH] Body:', body);
    console.log('🔄 [LANCAMENTOS PATCH] Novo status:', body.status);
    
    const [existingRows] = await accessPool.execute(
      'SELECT id, status FROM lancamentos WHERE id = ?',
      [id]
    );
    
    if ((existingRows as Array<{ id: number; status: string }>).length === 0) {
      console.log('❌ [LANCAMENTOS PATCH] Lançamento não encontrado');
      return NextResponse.json(
        { error: 'Lançamento não encontrado' },
        { status: 404 }
      );
    }
    
    const lancamentoExistente = (existingRows as Array<{ id: number; status: string }>)[0];
    console.log('📊 [LANCAMENTOS PATCH] Status atual no banco:', lancamentoExistente.status);
    
    await accessPool.execute(
      'UPDATE lancamentos SET status = ? WHERE id = ?',
      [body.status, id]
    );
    
    // Verificar se a atualização foi bem-sucedida
    const [updatedRows] = await accessPool.execute(
      'SELECT id, status FROM lancamentos WHERE id = ?',
      [id]
    );
    
    const lancamentoAtualizado = (updatedRows as Array<{ id: number; status: string }>)[0];
    console.log('✅ [LANCAMENTOS PATCH] Status após atualização:', lancamentoAtualizado.status);
    
    return NextResponse.json({ 
      success: true, 
      message: `Lançamento ${body.status === 'Ativo' ? 'ativado' : 'desativado'} com sucesso`,
      oldStatus: lancamentoExistente.status,
      newStatus: lancamentoAtualizado.status
    });
  } catch (error) {
    console.error('❌ [LANCAMENTOS PATCH] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
} 