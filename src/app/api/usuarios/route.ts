import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";
import { z } from "zod";
import { createUsuarioSchema } from "./schema/formSchemaUsuarios";
import { updateUsuarioSchema } from "./schema/formShemaUpdateUsuario";
import bcrypt from 'bcryptjs';
export type CreateUsuarioDTO = z.infer<typeof createUsuarioSchema>;
export type UpdateUsuarioDTO = z.infer<typeof updateUsuarioSchema>;
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '10'
    const search = searchParams.get('search') || ''
    const all = searchParams.get('all') || ''
    try {
      await accessPool.execute('DESCRIBE usuarios');
    } catch (structureError) {
      return NextResponse.json(
        { error: 'Erro ao verificar estrutura da tabela', details: (structureError as Error).message },
        { status: 500 }
      );
    }
    if ((limit === '1000' || all === 'true') && !search) {
      try {
        const [rows] = await accessPool.execute(
          'SELECT id, login, nome, email, status FROM usuarios ORDER BY status ASC, nome ASC'
        );
        const usuarios = rows as Array<{
          id: number;
          login: string;
          nome: string;
          email: string;
          status: string;
        }>;
        return NextResponse.json({
          data: usuarios,
          pagination: {
            page: 1,
            limit: usuarios.length,
            total: usuarios.length,
            totalPages: 1
          }
        });
      } catch (dbError) {
        throw dbError;
      }
    }
    let query = 'SELECT id, login, nome, email, status FROM usuarios WHERE 1=1'
    if (search) {
      query += ` AND (nome LIKE '%${search}%' OR email LIKE '%${search}%')`
    }
    const offset = (parseInt(page) - 1) * parseInt(limit)
    query += ` ORDER BY status ASC, nome ASC LIMIT ${parseInt(limit)} OFFSET ${offset}`
    const [userRows] = await accessPool.execute(query)
    const usuarios = userRows as Array<{
      id: number;
      login: string;
      nome: string;
      email: string;
      status: string;
    }>;
    const usuariosComGrupos = await Promise.all(
      usuarios.map(async (usuario) => {
        try {
          const [grupoRows] = await accessPool.execute(
            `SELECT g.nome as grupo_nome, g.sistemaId, s.nome as sistema_nome
             FROM usuariogrupo ug 
             INNER JOIN grupo g ON ug.grupo_id = g.id 
             INNER JOIN sistema s ON g.sistemaId = s.id
             WHERE ug.usuario_id = ?`,
            [usuario.id]
          );
          const grupos = (grupoRows as Array<{ grupo_nome: string; sistemaId: number; sistema_nome: string }>).map(g => ({
            nome: g.grupo_nome,
            sistema: g.sistema_nome,
            sistemaId: g.sistemaId
          }));
          return {
            ...usuario,
            grupos: grupos
          };
        } catch (error) {
          return {
            ...usuario,
            grupos: []
          };
        }
      })
    );
    let countQuery = 'SELECT COUNT(*) as total FROM usuarios WHERE 1=1'
    if (search) {
      countQuery += ` AND (nome LIKE '%${search}%' OR email LIKE '%${search}%')`
    }
    const [countRows] = await accessPool.execute(countQuery)
    const total = (countRows as Array<{ total: number }>)[0]?.total || 0
    const totalPages = Math.ceil(total / parseInt(limit))
    return NextResponse.json({
      data: usuariosComGrupos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: totalPages
      }
    })
  } catch (error) {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createUsuarioSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }
    const { ...payload } = validatedData.data;
    const hashedPassword = await bcrypt.hash(payload.senha, 10);
    await accessPool.execute(
      'INSERT INTO usuarios (login, nome, email, senha, status) VALUES (?, ?, ?, ?, ?)',
      [payload.email, payload.nome, payload.email, hashedPassword, 'Ativo']
    );
    return NextResponse.json({ success: true, login: payload.email });
  } catch (error) {
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
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const login = searchParams.get('login');
    if (!login) {
      return NextResponse.json({ error: 'Login é obrigatório' }, { status: 400 });
    }
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
    const params: (string | number)[] = [];
    if (payload.nome) {
      query += 'nome = ?, ';
      params.push(payload.nome);
    }
    if (payload.email) {
      query += 'email = ?, ';
      params.push(payload.email);
    }
    if (payload.senha) {
      const hashedPassword = await bcrypt.hash(payload.senha, 10);
      query += 'senha = ?, ';
      params.push(hashedPassword);
    }
    query = query.slice(0, -2) + ' WHERE login = ?';
    params.push(login);
    await accessPool.execute(query, params);
    return NextResponse.json({ success: true });
  } catch (error) {
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
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const login = searchParams.get('login');
    if (!login) {
      return NextResponse.json({ error: 'Login é obrigatório' }, { status: 400 });
    }
    
    // Verificar se o usuário existe
    const [existingUser] = await accessPool.execute(
      'SELECT id, login FROM usuarios WHERE login = ?',
      [login]
    );
    
    if (!(existingUser as Array<{ id: number; login: string }>).length) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    const userId = (existingUser as Array<{ id: number; login: string }>)[0].id;
    
    // Deletar primeiro os relacionamentos na tabela usuariogrupo
    await accessPool.execute(
      'DELETE FROM usuariogrupo WHERE usuario_id = ?',
      [userId]
    );
    
    // Depois deletar o usuário
    await accessPool.execute(
      'DELETE FROM usuarios WHERE login = ?',
      [login]
    );
    
    return NextResponse.json({ success: true, message: 'Usuário deletado permanentemente com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}