import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [rows] = await accessPool.execute(
      'SELECT * FROM procedimentos WHERE id = ?',
      [id]
    );
    if ((rows as Array<{
      id: number;
      nome: string;
      codigo: string;
      tipo: string;
      especialidade_id: number;
      status: string;
      created_at: Date;
      updated_at: Date;
    }>).length === 0) {
      return NextResponse.json(
        { error: 'Procedimento não encontrado' },
        { status: 404 }
      );
    }
    const procedimento = (rows as Array<{
      id: number;
      nome: string;
      codigo: string;
      tipo: string;
      especialidade_id: number;
      status: string;
      created_at: Date;
      updated_at: Date;
    }>)[0];
    return NextResponse.json(procedimento);
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
      `UPDATE procedimentos SET 
        nome = ?, codigo = ?, tipo = ?, especialidade_id = ?
       WHERE id = ?`,
      [
        body.nome, body.codigo, body.tipo, body.especialidade_id, id
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
    
    // Atualizar apenas o status
    if (body.status) {
      await accessPool.execute(
        'UPDATE procedimentos SET status = ? WHERE id = ?',
        [body.status, id]
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar status do procedimento:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar status do procedimento' },
      { status: 500 }
    );
  }
} 