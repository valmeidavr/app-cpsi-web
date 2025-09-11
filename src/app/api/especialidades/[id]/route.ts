import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [rows] = await accessPool.execute(
      'SELECT * FROM especialidades WHERE id = ?',
      [id]
    );
    if ((rows as Array<{
      id: number;
      nome: string;
      codigo: string;
      status: string;
      createdAt: Date;
      updatedAt: Date;
    }>).length === 0) {
      return NextResponse.json(
        { error: 'Especialidade não encontrada' },
        { status: 404 }
      );
    }
    const especialidade = (rows as Array<{
      id: number;
      nome: string;
      codigo: string;
      status: string;
      createdAt: Date;
      updatedAt: Date;
    }>)[0];
    return NextResponse.json(especialidade);
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
      `UPDATE especialidades SET 
        nome = ?, codigo = ?
       WHERE id = ?`,
      [body.nome, body.codigo, id]
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
        'UPDATE especialidades SET status = ? WHERE id = ?',
        [body.status, id]
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar status' },
      { status: 500 }
    );
  }
} 