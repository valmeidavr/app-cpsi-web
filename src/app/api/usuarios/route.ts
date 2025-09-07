import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";
import { z } from "zod";
import { createUsuarioSchema } from "./schema/formSchemaUsuarios";
import { updateUsuarioSchema } from "./schema/formShemaUpdateUsuario";
import bcrypt from 'bcrypt';

export type CreateUsuarioDTO = z.infer<typeof createUsuarioSchema>;
export type UpdateUsuarioDTO = z.infer<typeof updateUsuarioSchema>;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '10'
    const search = searchParams.get('search') || ''
    const all = searchParams.get('all') || ''

    // Verificar a estrutura da tabela
    try {
      await accessPool.execute('DESCRIBE usuarios');
    } catch (structureError) {
      console.error('Erro ao verificar estrutura da tabela:', structureError);
      return NextResponse.json(
        { error: 'Erro ao verificar estrutura da tabela', details: structureError.message },
        { status: 500 }
      );
    }

    // Para o cadastro de lançamentos, sempre retornar todos os usuários
    if ((limit === '1000' || all === 'true') && !search) {
      try {
        const [rows] = await accessPool.execute(
          'SELECT login, nome, email, status FROM usuarios WHERE status = "Ativo" ORDER BY nome ASC'
        );
        const usuarios = rows as Array<{
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
        console.error('Erro ao consultar banco:', dbError);
        throw dbError;
      }
    }

    // Lógica para busca com paginação - versão sem parâmetros preparados
    let query = 'SELECT login, nome, email, status FROM usuarios WHERE status = "Ativo"'

    if (search) {
      query += ` AND (nome LIKE '%${search}%' OR email LIKE '%${search}%')`
    }

    const offset = (parseInt(page) - 1) * parseInt(limit)
    query += ` ORDER BY nome ASC LIMIT ${parseInt(limit)} OFFSET ${offset}`

    const [userRows] = await accessPool.execute(query)
    const usuarios = userRows as Array<{
      login: string;
      nome: string;
      email: string;
      status: string;
    }>;

    // Buscar total de registros para paginação
    let countQuery = 'SELECT COUNT(*) as total FROM usuarios WHERE status = "Ativo"'

    if (search) {
      countQuery += ` AND (nome LIKE '%${search}%' OR email LIKE '%${search}%')`
    }

    const [countRows] = await accessPool.execute(countQuery)
    const total = (countRows as Array<{ total: number }>)[0]?.total || 0
    const totalPages = Math.ceil(total / parseInt(limit))

    return NextResponse.json({
      data: usuarios,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: totalPages
      }
    })
  } catch (error) {
    console.error('🔍 API Debug - Erro ao buscar usuários:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createUsuarioSchema.parse(body);
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(validatedData.senha, 10);
    
    // Inserir usuário - usando email como login já que o schema não tem campo login
    await accessPool.execute(
      'INSERT INTO usuarios (login, nome, email, senha, status) VALUES (?, ?, ?, ?, ?)',
      [validatedData.email, validatedData.nome, validatedData.email, hashedPassword, 'Ativo']
    );
    
    return NextResponse.json({ success: true, login: validatedData.email });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
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
    
    if (validatedData.senha) {
      const hashedPassword = await bcrypt.hash(validatedData.senha, 10);
      query += 'senha = ?, ';
      params.push(hashedPassword);
    }
    
    // Remove a vírgula extra e adiciona WHERE
    query = query.slice(0, -2) + ' WHERE login = ?';
    params.push(login);
    
    await accessPool.execute(query, params);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
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
      'SELECT login FROM usuarios WHERE login = ?',
      [login]
    );
    
    if (!(existingUser as any[]).length) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    // Soft delete - marcar como inativo em vez de deletar
    await accessPool.execute(
      'UPDATE usuarios SET status = "Inativo" WHERE login = ?',
      [login]
    );
    
    return NextResponse.json({ success: true, message: 'Usuário desativado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}