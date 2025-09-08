import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";
import { z } from "zod";
import { updateUsuarioSchema } from "../schema/formShemaUpdateUsuario";
export type UpdateUsuarioDTO = z.infer<typeof updateUsuarioSchema>;
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }
    const [rows] = await accessPool.execute(
      'SELECT id, nome, email, status FROM usuarios WHERE id = ? AND status = "Ativo"',
      [id]
    );
    const usuarios = rows as Array<{
      id: number;
      nome: string;
      email: string;
      status: string;
    }>;
    const usuario = usuarios[0] || null;
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
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }
    const body = await request.json();
    const validatedData = updateUsuarioSchema.parse(body);
    let query = 'UPDATE usuarios SET ';
    const params: (string | number)[] = [];
    if (validatedData.nome) {
      query += 'nome = ?, ';
      params.push(validatedData.nome);
    }
    if (validatedData.email) {
      query += 'email = ?, ';
      params.push(validatedData.email);
    }
    query = query.slice(0, -2) + ' WHERE id = ?';
    params.push(id);
    await accessPool.execute(query, params);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 