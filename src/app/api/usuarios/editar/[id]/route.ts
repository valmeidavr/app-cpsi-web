import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";
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
    
    // Buscar grupos do usuário
    const [grupoRows] = await accessPool.execute(
      `SELECT grupo_id as id, 
              CASE grupo_id 
                WHEN 1 THEN 'Administrador' 
                WHEN 2 THEN 'Gestor' 
                WHEN 3 THEN 'Usuário' 
                WHEN 4 THEN 'Operador' 
                ELSE CONCAT('Grupo ', grupo_id) 
              END as nome
       FROM usuariogrupo 
       WHERE usuario_login = ?`,
      [id]
    );
    
    return NextResponse.json({
      ...usuario,
      sistemas: grupoRows
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
    const validatedData = updateUsuarioSchema.parse(body);
    
    let query = 'UPDATE usuarios SET ';
    const queryParams: (string | number)[] = [];
    
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
    queryParams.push(id);
    
    await accessPool.execute(query, queryParams);
    
    // Atualizar grupos do usuário
    if (validatedData.grupos && validatedData.grupos.length > 0) {
      // Remover grupos atuais
      await accessPool.execute(
        'DELETE FROM usuariogrupo WHERE usuario_login = ?',
        [id]
      );
      
      // Inserir novos grupos
      for (const grupoId of validatedData.grupos) {
        await accessPool.execute(
          'INSERT INTO usuariogrupo (usuario_login, grupo_id) VALUES (?, ?)',
          [id, grupoId]
        );
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 