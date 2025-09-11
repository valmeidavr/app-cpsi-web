import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [rows] = await accessPool.execute(
      'SELECT login, nome, email, status FROM usuarios WHERE login = ?',
      [id]
    );
    const usuarios = rows as Array<{
      login: string;
      nome: string;
      email: string;
      status: string;
    }>;
    const usuario = usuarios[0];
    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    return NextResponse.json(usuario);
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
        'UPDATE usuarios SET status = ? WHERE login = ?',
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