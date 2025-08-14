import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";
import { z } from "zod";
import { updateUsuarioSchema } from "../schema/formShemaUpdateUsuario";

export type UpdateUsuarioDTO = z.infer<typeof updateUsuarioSchema>;

// Função para buscar usuário por ID (sem bcrypt)
export async function getUsuarioById(id: string) {
  try {
    const [rows] = await accessPool.execute(
      'SELECT id, nome, email, status FROM usuarios WHERE id = ? AND status = "Ativo"',
      [id]
    );
    
    const usuarios = rows as any[];
    return usuarios[0] || null;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    throw new Error('Erro ao buscar usuário');
  }
}

// Função para atualizar usuário (sem bcrypt)
export async function updateUsuario(id: string, data: UpdateUsuarioDTO) {
  try {
    let query = 'UPDATE usuarios SET ';
    const params: any[] = [];
    
    if (data.nome) {
      query += 'nome = ?, ';
      params.push(data.nome);
    }
    
    if (data.email) {
      query += 'email = ?, ';
      params.push(data.email);
    }
    
    // Remove a vírgula extra e adiciona WHERE
    query = query.slice(0, -2) + ' WHERE id = ?';
    params.push(id);
    
    await accessPool.execute(query, params);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    throw new Error('Erro ao atualizar usuário');
  }
}

// API route para GET
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
    }
    
    const usuario = await getUsuarioById(id);
    
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
    
    await updateUsuario(id, validatedData);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro na API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 