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

    console.log('API GET /api/usuarios chamada com:', { page, limit, search, all })

    // Se o parâmetro 'all' estiver presente, retorna todos os usuários sem paginação
    if (all === 'true') {
      const [rows] = await accessPool.execute(
        'SELECT login, nome, email, status FROM usuarios  ORDER BY nome ASC'
      );
      const usuarios = rows as any[];
      return NextResponse.json({
        data: usuarios,
        pagination: {
          page: 1,
          limit: usuarios.length,
          total: usuarios.length,
          totalPages: 1
        }
      });
    }

    // Se não há busca e é uma busca sem limite, retorna vazio
    if (!search && limit === '1000') {
      console.log('Retornando lista vazia - sem busca e limit=1000')
      return NextResponse.json({
        data: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 1
        }
      })
    }

    let query = 'SELECT login, nome, email, status FROM usuarios '
    const params: (string | number)[] = []

    if (search) {
      query += ' AND (nome LIKE ? OR email LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
      console.log('Query com busca:', query, 'Params:', params)
    }

    // Adicionar paginação apenas se não for busca sem limite
    if (limit !== '1000') {
      const offset = (parseInt(page) - 1) * parseInt(limit)
      query += ' ORDER BY nome ASC LIMIT ? OFFSET ?'
      params.push(parseInt(limit), offset)
    } else {
      query += ' ORDER BY nome ASC'
    }

    const [userRows] = await accessPool.execute(query, params)
    const usuarios = userRows as any[]
    console.log('Usuários encontrados:', usuarios.length)

    // Buscar sistemas de cada usuário
    const usuariosComSistemas = await Promise.all(
      usuarios.map(async (usuario) => {
        const [sistemaRows] = await accessPool.execute(
          `SELECT s.id, s.nome, us.nivel 
           FROM sistemas s 
           INNER JOIN usuario_sistema us ON s.id = us.sistemas_id 
           WHERE us.usuarios_login = ?`,
          [usuario.login]
        )
        
        return {
          ...usuario,
          sistemas: sistemaRows
        }
      })
    )

    // Buscar total de registros para paginação apenas se não for busca sem limite
    let total = usuariosComSistemas.length
    let totalPages = 1
    
    if (limit !== '1000') {
      let countQuery = 'SELECT COUNT(*) as total FROM usuarios '
      const countParams: (string)[] = []

      if (search) {
        countQuery += ' AND (nome LIKE ? OR email LIKE ?)'
        countParams.push(`%${search}%`, `%${search}%`)
      }

      const [countRows] = await accessPool.execute(countQuery, countParams)
      total = (countRows as any[])[0]?.total || 0
      totalPages = Math.ceil(total / parseInt(limit))
    }

    return NextResponse.json({
      data: usuariosComSistemas,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    })
  } catch (error) {
    console.error('Erro ao buscar usuários:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função para criar usuário
export async function createUsuario(data: CreateUsuarioDTO) {
  try {
    // Hash da senha
    const hashedPassword = await bcrypt.hash(data.senha, 10);
    
    // Inserir usuário
    const [result] = await accessPool.execute(
      'INSERT INTO usuarios (nome, email, senha, status) VALUES (?, ?, ?, ?)',
      [data.nome, data.email, hashedPassword, 'Ativo']
    );
    
    return NextResponse.json({ success: true, id: (result as any).insertId });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    throw new Error('Erro ao criar usuário');
  }
}

// Função para buscar usuário por ID
export async function getUsuarioById(id: string) {
  try {
    const [rows] = await accessPool.execute(
      'SELECT * FROM usuarios WHERE id = ? AND status = "Ativo"',
      [id]
    );
    
    const usuarios = rows as any[];
    return usuarios[0] || null;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    throw new Error('Erro ao buscar usuário');
  }
}

// Função para atualizar usuário
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
    
    if (data.senha) {
      const hashedPassword = await bcrypt.hash(data.senha, 10);
      query += 'senha = ?, ';
      params.push(hashedPassword);
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

// Função para buscar todos os usuários (simplificada)
export async function getUsuarios() {
  try {
    const [rows] = await accessPool.execute(
      'SELECT login, nome, email, status FROM usuarios  ORDER BY nome ASC'
    );
    console.log('Usuários encontrados:', rows);
    return rows;
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    throw new Error('Erro ao buscar usuários');
  }
}
