import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";
import { z } from "zod";
import { updateUsuarioSchema } from "../schema/formShemaUpdateUsuario";

export type UpdateUsuarioDTO = z.infer<typeof updateUsuarioSchema>;

// API route para GET
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }
    
    // Função para buscar usuário por ID (sem bcrypt)
    const [rows] = await gestorPool.execute(
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
    console.error('Erro na API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// API route para PUT (atualizar)
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }
    
    const body = await request.json();
    const validatedData = updateUsuarioSchema.parse(body);
    
    // Função para atualizar usuário (sem bcrypt)
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
    
    // Remove a vírgula extra e adiciona WHERE
    query = query.slice(0, -2) + ' WHERE id = ?';
    params.push(id);
    
    await gestorPool.execute(query, params);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro na API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 