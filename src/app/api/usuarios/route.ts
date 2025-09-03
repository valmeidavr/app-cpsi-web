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

    console.log('🔍 API Debug - GET /api/usuarios chamada com:', { page, limit, search, all })

    // Para o cadastro de lançamentos, sempre retornar todos os usuários
    if ((limit === '1000' || all === 'true') && !search) {
      console.log('🔍 API Debug - Retornando todos os usuários...');
      
      try {
        // Primeiro, vamos ver a estrutura real da tabela
        const [structureRows] = await accessPool.execute('DESCRIBE usuarios');
        console.log('🔍 API Debug - Estrutura da tabela usuarios:', structureRows);
        
        // Buscar usuários com a estrutura correta
        const [rows] = await accessPool.execute(
          'SELECT login, nome, email, status FROM usuarios WHERE status = "Ativo" ORDER BY nome ASC'
        );
        const usuarios = rows as Array<{
          login: string;
          nome: string;
          email: string;
          status: string;
        }>;
        
        console.log('🔍 API Debug - Usuários encontrados no banco:', usuarios.length);
        console.log('🔍 API Debug - Primeiro usuário:', usuarios[0]);
        
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
        console.error('🔍 API Debug - Erro ao consultar banco:', dbError);
        throw dbError;
      }
    }

    // Lógica para busca com paginação
    let query = 'SELECT login, nome, email, status FROM usuarios WHERE status = "Ativo"'
    const params: (string | number)[] = []

    if (search) {
      query += ' AND (nome LIKE ? OR email LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
      console.log('🔍 API Debug - Query com busca:', query, 'Params:', params)
    }

    const offset = (parseInt(page) - 1) * parseInt(limit)
    query += ' ORDER BY nome ASC LIMIT ? OFFSET ?'
    params.push(parseInt(limit), offset)

    // Debug logs removidos para evitar spam

    const [userRows] = await accessPool.execute(query, params)
    const usuarios = userRows as Array<{
      login: string;
      nome: string;
      email: string;
      status: string;
    }>;
    // Debug logs removidos para evitar spam

    // Buscar total de registros para paginação
    let countQuery = 'SELECT COUNT(*) as total FROM usuarios WHERE status = "Ativo"'
    const countParams: (string)[] = []

    if (search) {
      countQuery += ' AND (nome LIKE ? OR email LIKE ?)'
      countParams.push(`%${search}%`, `%${search}%`)
    }

    const [countRows] = await accessPool.execute(countQuery, countParams)
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
    const validatedData = createUsuarioSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    const { ...payload } = validatedData.data;

    // Hash da senha
    const hashedPassword = await bcrypt.hash(payload.senha, 10);
    
    // Inserir usuário - usando email como login já que o schema não tem campo login
    await accessPool.execute(
      'INSERT INTO usuarios (login, nome, email, senha, status) VALUES (?, ?, ?, ?, ?)',
      [payload.email, payload.nome, payload.email, hashedPassword, 'Ativo']
    );
    
    return NextResponse.json({ success: true, login: payload.email });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
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
    
    // Remove a vírgula extra e adiciona WHERE
    query = query.slice(0, -2) + ' WHERE login = ?';
    params.push(login);
    
    await accessPool.execute(query, params);
    
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