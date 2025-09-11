import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";
import { z } from "zod";
import { updateUsuarioSchema } from "../../schema/formShemaUpdateUsuario";
import bcrypt from 'bcryptjs';
export type UpdateUsuarioDTO = z.infer<typeof updateUsuarioSchema>;
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Buscar usuário por ID ou login (para compatibilidade)
    let userRows;
    
    // Primeiro tenta buscar por ID numérico
    if (!isNaN(Number(id))) {
      [userRows] = await accessPool.execute(
        'SELECT id, login, nome, email, status FROM usuarios WHERE id = ?',
        [id]
      );
    } else {
      // Se não for numérico, busca por login
      [userRows] = await accessPool.execute(
        'SELECT id, login, nome, email, status FROM usuarios WHERE login = ?',
        [id]
      );
    }
    const usuarios = userRows as Array<{
      id: number;
      login: string;
      nome: string;
      email: string;
      status: string;
    }>;
    const usuario = usuarios[0];
    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    // Buscar grupos do usuário usando usuario_id
    const [grupoRows] = await accessPool.execute(
      `SELECT ug.grupo_id as id, g.nome
       FROM usuariogrupo ug
       LEFT JOIN grupo g ON g.id = ug.grupo_id 
       WHERE ug.usuario_id = ?`,
      [usuario.id]
    );
    return NextResponse.json({
      id: usuario.id,
      login: usuario.login,
      nome: usuario.nome,
      email: usuario.email,
      status: usuario.status,
      sistemas: grupoRows
    });
  } catch (error) {
    console.error('GET /usuarios/editar - Error:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
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
    
    console.log('PUT /usuarios/editar - ID:', id);
    console.log('PUT /usuarios/editar - Body:', body);
    
    const validatedData = updateUsuarioSchema.safeParse(body);
    if (!validatedData.success) {
      console.log('PUT /usuarios/editar - Validation failed:', validatedData.error.flatten());
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }
    
    const { ...payload } = validatedData.data;
    console.log('PUT /usuarios/editar - Payload:', payload);
    
    let query = 'UPDATE usuarios SET ';
    const queryParams: (string | number)[] = [];
    let hasUpdates = false;
    
    if (payload.nome) {
      query += 'nome = ?, ';
      queryParams.push(payload.nome);
      hasUpdates = true;
    }
    if (payload.email) {
      query += 'email = ?, ';
      queryParams.push(payload.email);
      hasUpdates = true;
    }
    if (payload.senha && payload.senha.trim() !== '') {
      const hashedPassword = await bcrypt.hash(payload.senha, 10);
      query += 'senha = ?, ';
      queryParams.push(hashedPassword);
      hasUpdates = true;
    }
    
    if (!hasUpdates) {
      console.log('PUT /usuarios/editar - No updates needed');
      return NextResponse.json({ success: true, message: 'Nenhuma alteração foi feita' });
    }
    
    // Determinar se é ID ou login para usar na condição WHERE
    if (!isNaN(Number(id))) {
      query = query.slice(0, -2) + ' WHERE id = ?';
    } else {
      query = query.slice(0, -2) + ' WHERE login = ?';
    }
    queryParams.push(id);
    
    console.log('PUT /usuarios/editar - Query:', query);
    console.log('PUT /usuarios/editar - Params:', queryParams);
    
    await accessPool.execute(query, queryParams);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /usuarios/editar - Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.flatten() },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor', 
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Buscar o usuário para obter o ID
    let userId: number;
    if (!isNaN(Number(id))) {
      const [userRows] = await accessPool.execute(
        'SELECT id FROM usuarios WHERE id = ?',
        [id]
      );
      if (!(userRows as Array<{ id: number }>).length) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      }
      userId = (userRows as Array<{ id: number }>)[0].id;
    } else {
      const [userRows] = await accessPool.execute(
        'SELECT id FROM usuarios WHERE login = ?',
        [id]
      );
      if (!(userRows as Array<{ id: number }>).length) {
        return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
      }
      userId = (userRows as Array<{ id: number }>)[0].id;
    }
    
    // Deletar primeiro os relacionamentos na tabela usuariogrupo
    await accessPool.execute(
      'DELETE FROM usuariogrupo WHERE usuario_id = ?',
      [userId]
    );
    
    // Depois deletar o usuário
    if (!isNaN(Number(id))) {
      await accessPool.execute(
        'DELETE FROM usuarios WHERE id = ?',
        [id]
      );
    } else {
      await accessPool.execute(
        'DELETE FROM usuarios WHERE login = ?',
        [id]
      );
    }
    
    return NextResponse.json({ success: true, message: 'Usuário deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
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
      if (!isNaN(Number(id))) {
        await accessPool.execute(
          'UPDATE usuarios SET status = ? WHERE id = ?',
          [body.status, id]
        );
      } else {
        await accessPool.execute(
          'UPDATE usuarios SET status = ? WHERE login = ?',
          [body.status, id]
        );
      }
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