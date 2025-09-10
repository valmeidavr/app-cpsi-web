import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";
export async function GET() {
  try {
    console.log('GET /api/usuarios/sistemas - Iniciando');
    
    // Garantir que as tabelas existem
    try {
      await accessPool.execute('DESCRIBE sistema');
    } catch (sistemaTableError) {
      console.log('GET /api/usuarios/sistemas - Criando tabela sistema');
      
      await accessPool.execute(`
        CREATE TABLE IF NOT EXISTS sistema (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nome VARCHAR(255) NOT NULL UNIQUE,
          descricao TEXT,
          ativo BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      // Inserir sistemas padrão
      await accessPool.execute(`
        INSERT IGNORE INTO sistema (id, nome, descricao) VALUES 
        (1, 'CPSI Principal', 'Sistema Principal de Gestão'),
        (2, 'CPSI Financeiro', 'Sistema de Gestão Financeira'),
        (3, 'CPSI Agendamentos', 'Sistema de Agendamentos'),
        (4, 'CPSI Relatórios', 'Sistema de Relatórios e Analytics')
      `);
    }
    
    try {
      await accessPool.execute('DESCRIBE grupo');
    } catch (tableError) {
      console.log('GET /api/usuarios/sistemas - Criando tabela grupo');
      
      await accessPool.execute(`
        CREATE TABLE IF NOT EXISTS grupo (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          sistemaId INT NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (sistemaId) REFERENCES sistema(id) ON DELETE CASCADE
        )
      `);
      
      // Inserir grupos padrão
      await accessPool.execute(`
        INSERT IGNORE INTO grupo (id, nome, sistemaId) VALUES 
        (1, 'Administrador', 1),
        (2, 'Gestor', 1),
        (3, 'Usuário', 1),
        (4, 'Operador', 1),
        (5, 'Financeiro Admin', 2),
        (6, 'Financeiro Usuário', 2),
        (7, 'Agendamento Admin', 3),
        (8, 'Agendamento Usuário', 3),
        (9, 'Relatório Admin', 4),
        (10, 'Relatório Usuário', 4)
      `);
    }
    
    // Buscar grupos da tabela grupo com informações do sistema usando JOIN
    const [gruposRows] = await accessPool.execute(`
      SELECT 
        g.id, 
        g.nome, 
        g.sistemaId,
        s.nome as sistema_nome
      FROM grupo g 
      INNER JOIN sistema s ON g.sistemaId = s.id
      ORDER BY g.sistemaId, g.nome
    `);
    
    // Se não houver grupos, retornar estrutura vazia
    if ((gruposRows as Array<any>).length === 0) {
      return NextResponse.json({ sistemas: [] });
    }
    
    // Organizar grupos por sistema
    const grupos = gruposRows as Array<{
      id: number;
      nome: string;
      sistemaId: number;
      sistema_nome: string;
    }>;
    
    // Agrupar por sistema
    const sistemaMap = new Map();
    grupos.forEach(grupo => {
      if (!sistemaMap.has(grupo.sistemaId)) {
        sistemaMap.set(grupo.sistemaId, {
          sistemaId: grupo.sistemaId,
          sistema_nome: grupo.sistema_nome,
          grupos: []
        });
      }
      sistemaMap.get(grupo.sistemaId).grupos.push({
        id: grupo.id,
        nome: grupo.nome
      });
    });
    
    const sistemas = Array.from(sistemaMap.values());
    
    return NextResponse.json({ sistemas });
  } catch (error) {
    console.error('Erro ao buscar grupos:', error);
    // Em caso de erro, retornar estrutura vazia
    return NextResponse.json({ sistemas: [] });
  }
}
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/usuarios/sistemas - Iniciando');
    
    const { userId } = await request.json();
    console.log('POST /api/usuarios/sistemas - userId:', userId);
    
    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 });
    }
    
    // Garantir que as tabelas existem
    try {
      await accessPool.execute('DESCRIBE grupo');
      await accessPool.execute('DESCRIBE usuariogrupo');
    } catch (tableError) {
      console.log('POST /api/usuarios/sistemas - Criando tabelas necessárias');
      
      await accessPool.execute(`
        CREATE TABLE IF NOT EXISTS grupo (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          sistemaId INT NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      await accessPool.execute(`
        CREATE TABLE IF NOT EXISTS usuariogrupo (
          id INT AUTO_INCREMENT PRIMARY KEY,
          usuario_id INT NOT NULL,
          grupo_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_user_group (usuario_id, grupo_id),
          INDEX idx_usuario_id (usuario_id),
          INDEX idx_grupo_id (grupo_id),
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
          FOREIGN KEY (grupo_id) REFERENCES grupo(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      // Inserir grupos padrão
      await accessPool.execute(`
        INSERT IGNORE INTO grupo (id, nome, sistemaId) VALUES 
        (1, 'Administrador', 1),
        (2, 'Gestor', 1),
        (3, 'Usuário', 1),
        (4, 'Operador', 1),
        (5, 'Financeiro Admin', 2),
        (6, 'Financeiro Usuário', 2),
        (7, 'Agendamento Admin', 3),
        (8, 'Agendamento Usuário', 3),
        (9, 'Relatório Admin', 4),
        (10, 'Relatório Usuário', 4)
      `);
    }
    
    // Buscar grupos organizados por sistema usando JOIN com tabela sistema
    const [gruposRows] = await accessPool.execute(`
      SELECT 
        g.id, 
        g.nome, 
        g.sistemaId,
        s.nome as sistema_nome
      FROM grupo g 
      INNER JOIN sistema s ON g.sistemaId = s.id
      ORDER BY g.sistemaId, g.nome
    `);
    
    // Primeiro buscar o ID do usuário pelo login
    const [userRows] = await accessPool.execute(
      'SELECT id FROM usuarios WHERE login = ?',
      [userId]
    );
    
    if ((userRows as Array<any>).length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    const usuarioId = (userRows as Array<any>)[0].id;
    
    // Buscar grupos do usuário
    const [usuarioGruposRows] = await accessPool.execute(
      'SELECT grupo_id FROM usuariogrupo WHERE usuario_id = ?',
      [usuarioId]
    );
    
    const grupos = gruposRows as Array<{
      id: number;
      nome: string;
      sistemaId: number;
      sistema_nome: string;
    }>;
    
    const usuarioGrupos = usuarioGruposRows as Array<{
      grupo_id: number;
    }>;
    
    const userGroupIds = usuarioGrupos.map(ug => ug.grupo_id);
    
    // Agrupar por sistema
    const sistemaMap = new Map();
    grupos.forEach(grupo => {
      if (!sistemaMap.has(grupo.sistemaId)) {
        sistemaMap.set(grupo.sistemaId, {
          sistemaId: grupo.sistemaId,
          sistema_nome: grupo.sistema_nome,
          grupos: [],
          grupoSelecionado: null
        });
      }
      
      const isSelected = userGroupIds.includes(grupo.id);
      sistemaMap.get(grupo.sistemaId).grupos.push({
        id: grupo.id,
        nome: grupo.nome,
        selected: isSelected
      });
      
      // Se este grupo está selecionado, marcar como grupo selecionado do sistema
      if (isSelected) {
        sistemaMap.get(grupo.sistemaId).grupoSelecionado = grupo.id;
      }
    });
    
    const sistemas = Array.from(sistemaMap.values());
    
    return NextResponse.json({ sistemas });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
export async function PUT(request: NextRequest) {
  try {
    console.log('PUT /api/usuarios/sistemas - Iniciando');
    
    const body = await request.json();
    console.log('PUT /api/usuarios/sistemas - Body recebido:', JSON.stringify(body, null, 2));
    
    const { userId, sistemas } = body;
    
    if (!userId) {
      console.log('PUT /api/usuarios/sistemas - userId não fornecido');
      return NextResponse.json({ error: 'UserId é obrigatório' }, { status: 400 });
    }
    
    if (!sistemas) {
      console.log('PUT /api/usuarios/sistemas - sistemas não fornecido');
      return NextResponse.json({ error: 'Sistemas são obrigatórios' }, { status: 400 });
    }
    
    if (!Array.isArray(sistemas)) {
      console.log('PUT /api/usuarios/sistemas - sistemas não é um array:', typeof sistemas);
      return NextResponse.json({ error: 'Sistemas deve ser um array' }, { status: 400 });
    }
    
    console.log('PUT /api/usuarios/sistemas - userId:', userId);
    console.log('PUT /api/usuarios/sistemas - sistemas:', sistemas.length, 'itens');
    
    // Verificar se o usuário existe e pegar seu ID
    const [userCheck] = await accessPool.execute(
      'SELECT id, login FROM usuarios WHERE login = ?',
      [userId]
    );
    
    if ((userCheck as Array<any>).length === 0) {
      console.log('PUT /api/usuarios/sistemas - Usuário não encontrado:', userId);
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    const usuarioId = (userCheck as Array<any>)[0].id;
    
    console.log('PUT /api/usuarios/sistemas - Usuário encontrado, verificando tabelas');
    
    // Verificar se as tabelas existem
    try {
      await accessPool.execute('DESCRIBE usuariogrupo');
      console.log('PUT /api/usuarios/sistemas - Tabela usuariogrupo encontrada');
    } catch (tableError) {
      console.error('PUT /api/usuarios/sistemas - Tabela usuariogrupo não encontrada:', tableError);
      
      // Criar tabela com estrutura correta
      await accessPool.execute(`
        CREATE TABLE IF NOT EXISTS usuariogrupo (
          id INT AUTO_INCREMENT PRIMARY KEY,
          usuario_id INT NOT NULL,
          grupo_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_user_group (usuario_id, grupo_id),
          INDEX idx_usuario_id (usuario_id),
          INDEX idx_grupo_id (grupo_id),
          FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
          FOREIGN KEY (grupo_id) REFERENCES grupo(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('PUT /api/usuarios/sistemas - Tabela usuariogrupo criada');
    }
    
    try {
      await accessPool.execute('DESCRIBE grupo');
      console.log('PUT /api/usuarios/sistemas - Tabela grupo encontrada');
    } catch (tableError) {
      console.error('PUT /api/usuarios/sistemas - Tabela grupo não encontrada:', tableError);
      
      // Criar tabela grupo se não existir
      await accessPool.execute(`
        CREATE TABLE IF NOT EXISTS grupo (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          sistemaId INT NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      // Inserir grupos padrão
      await accessPool.execute(`
        INSERT IGNORE INTO grupo (id, nome, sistemaId) VALUES 
        (1, 'Administrador', 1),
        (2, 'Gestor', 1),
        (3, 'Usuário', 1),
        (4, 'Operador', 1),
        (5, 'Financeiro Admin', 2),
        (6, 'Financeiro Usuário', 2),
        (7, 'Agendamento Admin', 3),
        (8, 'Agendamento Usuário', 3),
        (9, 'Relatório Admin', 4),
        (10, 'Relatório Usuário', 4)
      `);
      console.log('PUT /api/usuarios/sistemas - Tabela grupo criada e populada');
    }
    
    console.log('PUT /api/usuarios/sistemas - Removendo grupos atuais');
    
    // Remover todos os grupos atuais do usuário
    await accessPool.execute(
      'DELETE FROM usuariogrupo WHERE usuario_id = ?',
      [usuarioId]
    );
    
    console.log('PUT /api/usuarios/sistemas - Grupos removidos, adicionando novos');
    
    // Adicionar os novos grupos selecionados (um por sistema)
    for (const sistema of sistemas) {
      console.log('PUT /api/usuarios/sistemas - Processando sistema:', sistema.sistemaId, 'grupo:', sistema.grupoSelecionado);
      
      if (sistema.grupoSelecionado && sistema.grupoSelecionado !== null) {
        console.log('PUT /api/usuarios/sistemas - Inserindo grupo:', sistema.grupoSelecionado, 'para usuário ID:', usuarioId);
        
        try {
          await accessPool.execute(
            'INSERT INTO usuariogrupo (usuario_id, grupo_id) VALUES (?, ?)',
            [usuarioId, sistema.grupoSelecionado]
          );
          console.log('PUT /api/usuarios/sistemas - Grupo inserido com sucesso');
        } catch (insertError) {
          console.error('PUT /api/usuarios/sistemas - Erro ao inserir grupo:', insertError);
          throw insertError;
        }
      } else {
        console.log('PUT /api/usuarios/sistemas - Nenhum grupo selecionado para sistema:', sistema.sistemaId);
      }
    }
    
    console.log('PUT /api/usuarios/sistemas - Operação concluída com sucesso');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/usuarios/sistemas - Erro geral:', error);
    
    if (error instanceof Error) {
      console.error('PUT /api/usuarios/sistemas - Erro detalhado:', error.message);
      console.error('PUT /api/usuarios/sistemas - Stack trace:', error.stack);
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