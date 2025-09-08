import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [rows] = await accessPool.execute(
      'SELECT login, nome, email, status FROM usuarios WHERE login = ? AND status = "Ativo"',
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