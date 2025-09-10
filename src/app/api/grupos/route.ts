import { NextRequest, NextResponse } from "next/server";
import { accessPool, executeWithRetry } from "@/lib/mysql";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// GET - Listar todos os grupos
export async function GET() {
  try {
    console.log('🔍 [GRUPOS GET] Iniciando busca de grupos');
    
    // Verificar se a tabela existe, se não, criar
    try {
      await accessPool.execute('DESCRIBE grupos');
    } catch (tableError) {
      console.log('📋 [GRUPOS GET] Tabela grupos não existe, criando...');
      
      await executeWithRetry(accessPool, `
        CREATE TABLE IF NOT EXISTS grupos (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nome VARCHAR(100) NOT NULL,
          descricao TEXT,
          status ENUM('Ativo', 'Inativo') DEFAULT 'Ativo',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      // Inserir grupos padrão
      await executeWithRetry(accessPool, `
        INSERT IGNORE INTO grupos (nome, descricao) VALUES 
        ('ADMIN', 'Administradores do sistema'),
        ('GESTOR', 'Gestores do sistema'),
        ('USUARIO', 'Usuários comuns')
      `);
      
      console.log('✅ [GRUPOS GET] Tabela grupos criada com dados padrão');
    }

    // Buscar todos os grupos ativos
    const grupos = await executeWithRetry(accessPool,
      'SELECT id, nome, descricao, status, created_at, updated_at FROM grupos WHERE status = "Ativo" ORDER BY nome'
    );

    console.log(`📊 [GRUPOS GET] Encontrados ${(grupos as Array<any>).length} grupos`);
    
    return NextResponse.json(grupos);
  } catch (error) {
    console.error('❌ [GRUPOS GET] Erro ao buscar grupos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

// POST - Criar novo grupo
export async function POST(request: NextRequest) {
  try {
    console.log('📝 [GRUPOS POST] Iniciando criação de grupo');
    
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('📋 [GRUPOS POST] Dados recebidos:', body);

    // Validar dados obrigatórios
    if (!body.nome || !body.nome.trim()) {
      return NextResponse.json(
        { error: 'Nome do grupo é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se já existe um grupo com o mesmo nome
    const grupoExistente = await executeWithRetry(accessPool,
      'SELECT id FROM grupos WHERE nome = ? AND status = "Ativo"',
      [body.nome.trim()]
    );

    if ((grupoExistente as Array<any>).length > 0) {
      return NextResponse.json(
        { error: 'Já existe um grupo com este nome' },
        { status: 400 }
      );
    }

    // Criar o grupo
    const resultado = await executeWithRetry(accessPool,
      'INSERT INTO grupos (nome, descricao, status) VALUES (?, ?, ?)',
      [body.nome.trim(), body.descricao?.trim() || null, 'Ativo']
    );

    const grupoId = (resultado as any).insertId;
    console.log('✅ [GRUPOS POST] Grupo criado com ID:', grupoId);

    // Buscar o grupo criado para retornar
    const novoGrupo = await executeWithRetry(accessPool,
      'SELECT id, nome, descricao, status, created_at, updated_at FROM grupos WHERE id = ?',
      [grupoId]
    );

    return NextResponse.json((novoGrupo as Array<any>)[0]);
  } catch (error) {
    console.error('❌ [GRUPOS POST] Erro ao criar grupo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}