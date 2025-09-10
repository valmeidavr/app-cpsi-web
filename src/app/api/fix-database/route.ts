import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Iniciando correção da tabela usuariogrupo...');

    // 1. Verificar estrutura atual
    console.log('📋 Verificando estrutura atual da tabela usuariogrupo...');
    let tableExists = true;
    let currentStructure = [];
    
    try {
      const [columns] = await accessPool.execute('DESCRIBE usuariogrupo');
      currentStructure = columns as any[];
      console.log('Estrutura atual:');
      currentStructure.forEach((col: any) => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Key === 'PRI' ? '(PRIMARY KEY)' : ''} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    } catch (error) {
      console.log('❌ Tabela usuariogrupo não existe');
      tableExists = false;
    }

    if (!tableExists) {
      // Criar tabela com estrutura correta
      console.log('🆕 Criando tabela usuariogrupo com estrutura correta...');
      
      await accessPool.execute(`
        CREATE TABLE usuariogrupo (
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
      
      console.log('✅ Tabela usuariogrupo criada com estrutura correta');
      
      return NextResponse.json({ 
        success: true, 
        message: 'Tabela usuariogrupo criada com sucesso',
        action: 'created'
      });
    }

    // 2. Fazer backup dos dados existentes
    console.log('💾 Fazendo backup dos dados...');
    await accessPool.execute('DROP TABLE IF EXISTS usuariogrupo_backup');
    await accessPool.execute('CREATE TABLE usuariogrupo_backup AS SELECT * FROM usuariogrupo');
    
    const [backupCount] = await accessPool.execute('SELECT COUNT(*) as count FROM usuariogrupo_backup');
    console.log(`✅ Backup realizado - ${(backupCount as any)[0].count} registros salvos`);

    // 3. Verificar estrutura atual
    const hasUsuarioId = currentStructure.some((col: any) => col.Field === 'usuario_id');
    const hasUsuarioLogin = currentStructure.some((col: any) => col.Field === 'usuario_login');
    const hasAdminPK = currentStructure.some((col: any) => col.Field === 'admin' && col.Key === 'PRI');
    const hasId = currentStructure.some((col: any) => col.Field === 'id');

    console.log(`Análise da estrutura:`);
    console.log(`  - Tem coluna usuario_id: ${hasUsuarioId}`);
    console.log(`  - Tem coluna usuario_login: ${hasUsuarioLogin}`);
    console.log(`  - Tem admin como PK: ${hasAdminPK}`);
    console.log(`  - Tem coluna id: ${hasId}`);

    // 4. Recriar a tabela com estrutura correta
    console.log('🔨 Recriando tabela com estrutura correta...');
    
    // Renomear tabela atual
    await accessPool.execute('RENAME TABLE usuariogrupo TO usuariogrupo_old');
    
    // Criar nova tabela com estrutura correta
    await accessPool.execute(`
      CREATE TABLE usuariogrupo (
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

    // 5. Migrar dados da tabela antiga para a nova
    console.log('📦 Migrando dados...');
    
    if (hasUsuarioLogin) {
      // Se tinha usuario_login, converter para usuario_id
      await accessPool.execute(`
        INSERT INTO usuariogrupo (usuario_id, grupo_id, created_at)
        SELECT 
          u.id as usuario_id,
          old.grupo_id,
          COALESCE(old.created_at, NOW()) as created_at
        FROM usuariogrupo_old old
        INNER JOIN usuarios u ON u.login = old.usuario_login
        WHERE old.grupo_id IS NOT NULL
      `);
    } else if (hasUsuarioId) {
      // Se já tinha usuario_id, migrar diretamente
      await accessPool.execute(`
        INSERT INTO usuariogrupo (usuario_id, grupo_id, created_at)
        SELECT 
          usuario_id,
          grupo_id,
          COALESCE(created_at, NOW()) as created_at
        FROM usuariogrupo_old
        WHERE usuario_id IS NOT NULL AND grupo_id IS NOT NULL
      `);
    } else {
      // Caso não tenha nem usuario_id nem usuario_login válidos
      console.log('⚠️ Estrutura da tabela antiga não compatível, não é possível migrar dados');
    }

    // 6. Verificar migração
    const [newCount] = await accessPool.execute('SELECT COUNT(*) as count FROM usuariogrupo');
    const [oldCount] = await accessPool.execute('SELECT COUNT(*) as count FROM usuariogrupo_old');
    
    console.log(`📊 Migração concluída:`);
    console.log(`  - Registros originais: ${(oldCount as any)[0].count}`);
    console.log(`  - Registros migrados: ${(newCount as any)[0].count}`);

    // 7. Remover tabela antiga
    await accessPool.execute('DROP TABLE usuariogrupo_old');
    console.log('🗑️ Tabela antiga removida');

    // 8. Verificar estrutura final
    console.log('📋 Estrutura final da tabela usuariogrupo:');
    const [finalColumns] = await accessPool.execute('DESCRIBE usuariogrupo');
    (finalColumns as any[]).forEach((col: any) => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Key === 'PRI' ? '(PRIMARY KEY)' : col.Key === 'UNI' ? '(UNIQUE)' : col.Key === 'MUL' ? '(INDEX)' : ''} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // 9. Dados de teste
    const [dataCount] = await accessPool.execute('SELECT COUNT(*) as count FROM usuariogrupo');
    console.log(`📊 Total de registros: ${(dataCount as any)[0].count}`);

    if ((dataCount as any)[0].count > 0) {
      const [sampleData] = await accessPool.execute('SELECT * FROM usuariogrupo LIMIT 3');
      console.log('Amostra de dados:');
      (sampleData as any[]).forEach((row: any, index: number) => {
        console.log(`  ${index + 1}. ID: ${row.id}, Usuario ID: ${row.usuario_id}, Grupo: ${row.grupo_id}`);
      });
    }

    console.log('🎉 Estrutura da tabela usuariogrupo corrigida com sucesso!');

    return NextResponse.json({ 
      success: true, 
      message: 'Tabela usuariogrupo corrigida com sucesso',
      action: 'fixed',
      stats: {
        originalRecords: (oldCount as any)[0].count,
        migratedRecords: (newCount as any)[0].count,
        backupTable: 'usuariogrupo_backup'
      }
    });

  } catch (error) {
    console.error('❌ Erro ao corrigir tabela usuariogrupo:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao corrigir tabela usuariogrupo',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}