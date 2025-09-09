import { NextRequest, NextResponse } from "next/server";
import { accessPool, executeWithRetry } from "@/lib/mysql";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rows = await executeWithRetry(accessPool,
      'SELECT id, dtagenda, situacao, cliente_id, convenio_id, procedimento_id, expediente_id, prestador_id, unidade_id, especialidade_id, tipo, tipo_cliente, created_at, updated_at FROM agendas WHERE id = ?',
      [id]
    );
    if ((rows as Array<{
      id: number;
      dtagenda: string;
      situacao: string;
      cliente_id: number;
      convenio_id: number;
      procedimento_id: number;
      expediente_id: number | null;
      prestador_id: number;
      unidade_id: number;
      especialidade_id: number;
      tipo: string;
      tipo_cliente: string;
      created_at: Date;
      updated_at: Date;
    }>).length === 0) {
      return NextResponse.json(
        { error: 'Agenda não encontrada' },
        { status: 404 }
      );
    }
    const agenda = (rows as Array<{
      id: number;
      dtagenda: string;
      situacao: string;
      cliente_id: number;
      convenio_id: number;
      procedimento_id: number;
      expediente_id: number | null;
      prestador_id: number;
      unidade_id: number;
      especialidade_id: number;
      tipo: string;
      tipo_cliente: string;
      created_at: Date;
      updated_at: Date;
    }>)[0];
    return NextResponse.json(agenda);
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
    await executeWithRetry(accessPool,
      `UPDATE agendas SET situacao = ? WHERE id = ?`,
      [body.situacao, id]
    );
    return NextResponse.json({ success: true });
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
    await executeWithRetry(accessPool,
      `UPDATE agendas SET 
        dtagenda = ?, situacao = ?, cliente_id = ?, convenio_id = ?, 
        procedimento_id = ?, expediente_id = ?, prestador_id = ?, 
        unidade_id = ?, especialidade_id = ?, tipo = ?, tipo_cliente = ?
       WHERE id = ?`,
      [
        body.dtagenda, body.situacao, body.cliente_id, body.convenio_id,
        body.procedimento_id, body.expediente_id, body.prestador_id,
        body.unidade_id, body.especialidade_id, body.tipo, body.tipo_cliente, id
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