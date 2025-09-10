const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function fixUsuariogrupoTable() {
  let connection;
  
  try {
    // Conectar ao banco
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "92.118.58.75",
      port: parseInt(process.env.DB_PORT || "3306"),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "Q7jrdhh6dg*()",
      database: process.env.DB_NAME || "prevsaude",
    });

    console.log('✅ Conectado ao banco de dados');

    // 1. Verificar estrutura atual
    console.log('\n📋 Verificando estrutura atual da tabela usuariogrupo...');
    try {
      const [columns] = await connection.execute('DESCRIBE usuariogrupo');
      console.log('Estrutura atual:');
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Key === 'PRI' ? '(PRIMARY KEY)' : ''} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default !== null ? `DEFAULT ${col.Default}` : ''}`);
      });
    } catch (error) {
      console.log('❌ Tabela usuariogrupo não existe, será criada');
      
      // Criar tabela com estrutura correta
      await connection.execute(`
        CREATE TABLE usuariogrupo (
          id INT AUTO_INCREMENT PRIMARY KEY,
          usuario_login VARCHAR(255) NOT NULL,
          grupo_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_user_group (usuario_login, grupo_id),
          INDEX idx_usuario_login (usuario_login),
          INDEX idx_grupo_id (grupo_id)
        )
      `);
      
      console.log('✅ Tabela usuariogrupo criada com estrutura correta');
      return;
    }

    // 2. Fazer backup dos dados
    console.log('\n💾 Fazendo backup dos dados...');
    await connection.execute('DROP TABLE IF EXISTS usuariogrupo_backup');
    await connection.execute('CREATE TABLE usuariogrupo_backup AS SELECT * FROM usuariogrupo');
    
    const [backupCount] = await connection.execute('SELECT COUNT(*) as count FROM usuariogrupo_backup');
    console.log(`✅ Backup realizado - ${backupCount[0].count} registros salvos`);

    // 3. Verificar se existe primary key 'admin' e remover
    console.log('\n🔧 Corrigindo primary key...');
    try {
      const [indexes] = await connection.execute("SHOW INDEX FROM usuariogrupo WHERE Key_name = 'PRIMARY'");
      if (indexes.length > 0) {
        console.log('Removendo primary key atual...');
        await connection.execute('ALTER TABLE usuariogrupo DROP PRIMARY KEY');
      }
    } catch (error) {
      console.log('⚠️ Sem primary key para remover');
    }

    // 4. Remover coluna 'admin' se existir
    console.log('\n🗑️ Removendo colunas problemáticas...');
    try {
      await connection.execute('ALTER TABLE usuariogrupo DROP COLUMN admin');
      console.log('✅ Coluna admin removida');
    } catch (error) {
      console.log('ℹ️ Coluna admin não existe');
    }

    // 5. Remover coluna 'usuario_id' se existir
    try {
      await connection.execute('ALTER TABLE usuariogrupo DROP COLUMN usuario_id');
      console.log('✅ Coluna usuario_id removida');
    } catch (error) {
      console.log('ℹ️ Coluna usuario_id não existe');
    }

    // 6. Adicionar coluna 'id' se não existir
    console.log('\n🆔 Adicionando coluna id como primary key...');
    try {
      await connection.execute('ALTER TABLE usuariogrupo ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST');
      console.log('✅ Coluna id adicionada como primary key');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('ℹ️ Coluna id já existe, configurando como primary key...');
        try {
          await connection.execute('ALTER TABLE usuariogrupo MODIFY COLUMN id INT AUTO_INCREMENT PRIMARY KEY FIRST');
          console.log('✅ Coluna id configurada como primary key');
        } catch (pkError) {
          console.log('⚠️ Erro ao configurar primary key:', pkError.message);
        }
      } else {
        console.log('⚠️ Erro ao adicionar coluna id:', error.message);
      }
    }

    // 7. Garantir estrutura correta das outras colunas
    console.log('\n🔧 Corrigindo estrutura das colunas...');
    await connection.execute('ALTER TABLE usuariogrupo MODIFY COLUMN usuario_login VARCHAR(255) NOT NULL');
    await connection.execute('ALTER TABLE usuariogrupo MODIFY COLUMN grupo_id INT NOT NULL');
    
    // Adicionar created_at se não existir
    try {
      await connection.execute('ALTER TABLE usuariogrupo ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      console.log('✅ Coluna created_at adicionada');
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log('ℹ️ Coluna created_at já existe');
      }
    }

    // 8. Recriar índices
    console.log('\n📊 Criando índices...');
    
    // Remover índices existentes se houver
    const indexesToDrop = ['unique_user_group', 'idx_usuario_login', 'idx_grupo_id'];
    for (const indexName of indexesToDrop) {
      try {
        await connection.execute(`ALTER TABLE usuariogrupo DROP INDEX ${indexName}`);
      } catch (error) {
        // Índice não existe, continuar
      }
    }

    // Criar novos índices
    await connection.execute('ALTER TABLE usuariogrupo ADD UNIQUE KEY unique_user_group (usuario_login, grupo_id)');
    await connection.execute('ALTER TABLE usuariogrupo ADD INDEX idx_usuario_login (usuario_login)');
    await connection.execute('ALTER TABLE usuariogrupo ADD INDEX idx_grupo_id (grupo_id)');
    console.log('✅ Índices criados');

    // 9. Verificar estrutura final
    console.log('\n📋 Estrutura final da tabela usuariogrupo:');
    const [finalColumns] = await connection.execute('DESCRIBE usuariogrupo');
    finalColumns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Key === 'PRI' ? '(PRIMARY KEY)' : col.Key === 'UNI' ? '(UNIQUE)' : col.Key === 'MUL' ? '(INDEX)' : ''} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default !== null ? `DEFAULT ${col.Default}` : ''}`);
    });

    // 10. Verificar dados
    const [dataCount] = await connection.execute('SELECT COUNT(*) as count FROM usuariogrupo');
    console.log(`\n📊 Total de registros: ${dataCount[0].count}`);

    if (dataCount[0].count > 0) {
      const [sampleData] = await connection.execute('SELECT * FROM usuariogrupo LIMIT 3');
      console.log('\nAmostrar de dados:');
      sampleData.forEach((row, index) => {
        console.log(`  ${index + 1}. ID: ${row.id}, Usuário: ${row.usuario_login}, Grupo: ${row.grupo_id}`);
      });
    }

    console.log('\n🎉 Estrutura da tabela usuariogrupo corrigida com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao corrigir tabela usuariogrupo:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

// Executar o script
if (require.main === module) {
  fixUsuariogrupoTable()
    .then(() => {
      console.log('\n✅ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro na execução do script:', error);
      process.exit(1);
    });
}

module.exports = { fixUsuariogrupoTable };