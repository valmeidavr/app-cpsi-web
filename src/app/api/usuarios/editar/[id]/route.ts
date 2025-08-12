import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";
import { z } from "zod";
import { updateUsuarioSchema } from "../../schema/formShemaUpdateUsuario";
import bcrypt from 'bcrypt';

export type UpdateUsuarioDTO = z.infer<typeof updateUsuarioSchema>;

// API route para GET (buscar usuário por ID)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const [rows] = await accessPool.execute(
      'SELECT login, nome, email, status FROM usuarios WHERE login = ? AND status = "Ativo"',
      [params.id]
    );
    
    const usuarios = rows as any[];
    const usuario = usuarios[0];
    
    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    // Buscar sistemas do usuário
    const [sistemaRows] = await accessPool.execute(
      `SELECT s.id, s.nome, us.nivel 
       FROM sistemas s 
       INNER JOIN usuario_sistema us ON s.id = us.sistemas_id 
       WHERE us.usuarios_login = ?`,
      [params.id]
    );
    
    return NextResponse.json({
      ...usuario,
      sistemas: sistemaRows
    });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// API route para PUT (atualizar usuário)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateUsuarioSchema.parse(body);
    
    let query = 'UPDATE usuarios SET ';
    const queryParams: any[] = [];
    
    if (validatedData.nome) {
      query += 'nome = ?, ';
      queryParams.push(validatedData.nome);
    }
    
    if (validatedData.email) {
      query += 'email = ?, ';
      queryParams.push(validatedData.email);
    }
    
    if (validatedData.senha) {
      const hashedPassword = await bcrypt.hash(validatedData.senha, 10);
      query += 'senha = ?, ';
      queryParams.push(hashedPassword);
    }
    
    // Remove a vírgula extra e adiciona WHERE
    query = query.slice(0, -2) + ' WHERE login = ?';
    queryParams.push(params.id);
    
    await accessPool.execute(query, queryParams);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 