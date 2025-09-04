import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";
import { z } from "zod";
import { updateUsuarioSchema } from "../../schema/formShemaUpdateUsuario";
import bcrypt from 'bcrypt';

export type UpdateUsuarioDTO = z.infer<typeof updateUsuarioSchema>;

// API route para GET (buscar usuário por ID)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const [rows] = await gestorPool.execute(
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
    
    // Buscar sistemas do usuário
    const [sistemaRows] = await gestorPool.execute(
      `SELECT s.id, s.nome, us.nivel 
       FROM sistemas s 
       INNER JOIN usuario_sistema us ON s.id = us.sistemas_id 
       WHERE us.usuarios_login = ?`,
      [id]
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateUsuarioSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    const { ...payload } = validatedData.data;

    let query = 'UPDATE usuarios SET ';
    const queryParams: (string | number)[] = [];
    
    if (payload.nome) {
      query += 'nome = ?, ';
      queryParams.push(payload.nome);
    }
    
    if (payload.email) {
      query += 'email = ?, ';
      queryParams.push(payload.email);
    }
    
    if (payload.senha) {
      const hashedPassword = await bcrypt.hash(payload.senha, 10);
      query += 'senha = ?, ';
      queryParams.push(hashedPassword);
    }
    
    // Remove a vírgula extra e adiciona WHERE
    query = query.slice(0, -2) + ' WHERE login = ?';
    queryParams.push(id);
    
    await gestorPool.execute(query, queryParams);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// API route para DELETE (deletar usuário)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Soft delete - marcar como inativo
    await gestorPool.execute(
      'UPDATE usuarios SET status = "Inativo" WHERE login = ?',
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}