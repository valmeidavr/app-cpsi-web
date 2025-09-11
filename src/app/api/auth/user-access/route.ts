import { NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Usuário não autenticado' }, { status: 401 });
    }
    const userId = session.user.id;
    const [sistemasRows] = await accessPool.execute(
      'SELECT id, nome FROM sistemas WHERE nome = "prevSaúde"'
    );
    const [acessoRows] = await accessPool.execute(
      `SELECT us.sistemas_id, us.nivel, s.nome as sistema_nome 
       FROM usuario_sistema us 
       INNER JOIN sistemas s ON us.sistemas_id = s.id 
       WHERE us.usuarios_login = ? AND s.id = 1087`,
      [userId]
    );
    console.log(acessoRows)
    const sistemas = sistemasRows as Array<{ id: number; nome: string }>;
    const acessos = acessoRows as Array<{ sistemas_id: number; nivel: string; sistema_nome: string }>;
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 