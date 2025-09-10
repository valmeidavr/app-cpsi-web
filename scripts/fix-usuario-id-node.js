const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixUsuarioId() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "92.118.58.75",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "Q7jrdhh6dg*()",
      database: process.env.DB_NAME || "prevsaude",
    });

    console.log('🔌 Conectado ao banco de dados');

    // Step 1: Check current structure
    console.log('📋 Verificando estrutura atual...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'prevsaude' 
      AND TABLE_NAME = 'lancamentos' 
      AND COLUMN_NAME = 'usuario_id'
    `);
    
    console.log('Estrutura atual do usuario_id:', columns[0]);

    // Step 2: Add temporary column
    console.log('➕ Adicionando coluna temporária...');
    await connection.execute(`
      ALTER TABLE lancamentos ADD COLUMN usuario_id_new INT NULL
    `);

    // Step 3: Check what data exists
    console.log('🔍 Verificando dados existentes...');
    const [dataCheck] = await connection.execute(`
      SELECT usuario_id, COUNT(*) as count 
      FROM lancamentos 
      GROUP BY usuario_id
    `);
    console.log('Dados atuais na coluna usuario_id:', dataCheck);

    // Step 4: Since column is already INT, just copy existing values
    console.log('📋 Copiando valores existentes...');
    await connection.execute(`
      UPDATE lancamentos 
      SET usuario_id_new = usuario_id
    `);

    // Step 5: For any null or invalid values, set to admin user ID
    console.log('🔧 Corrigindo valores nulos...');
    const [adminUser] = await connection.execute(`
      SELECT id FROM usuarios WHERE login = 'admin' LIMIT 1
    `);
    
    if (adminUser.length > 0) {
      const adminId = adminUser[0].id;
      const [nullResult] = await connection.execute(`
        UPDATE lancamentos 
        SET usuario_id_new = ? 
        WHERE usuario_id_new IS NULL OR usuario_id_new = 0
      `, [adminId]);
      console.log(`✅ ${nullResult.affectedRows} registros corrigidos para admin ID: ${adminId}`);
    }

    // Step 5: Check for any remaining null values
    const [nullCheck] = await connection.execute(`
      SELECT COUNT(*) as count FROM lancamentos WHERE usuario_id_new IS NULL
    `);
    console.log(`⚠️  ${nullCheck[0].count} registros ficarão com usuario_id NULL`);

    // Step 6: Since the original column is already correct, just remove temp column
    console.log('🗑️  Removendo coluna temporária...');
    await connection.execute(`ALTER TABLE lancamentos DROP COLUMN usuario_id_new`);

    // Step 8: Add foreign key constraint
    console.log('🔗 Adicionando chave estrangeira...');
    await connection.execute(`
      ALTER TABLE lancamentos 
      ADD CONSTRAINT fk_lancamentos_usuario 
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
    `);

    // Step 9: Update index
    console.log('📊 Atualizando índices...');
    try {
      await connection.execute(`DROP INDEX idx_lancamentos_usuario ON lancamentos`);
    } catch (error) {
      console.log('ℹ️  Índice anterior não existia, continuando...');
    }
    
    await connection.execute(`
      CREATE INDEX idx_lancamentos_usuario ON lancamentos(usuario_id)
    `);

    // Step 10: Verify the changes
    console.log('✅ Verificando alterações...');
    const [newColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'prevsaude' 
      AND TABLE_NAME = 'lancamentos' 
      AND COLUMN_NAME = 'usuario_id'
    `);
    
    console.log('Nova estrutura do usuario_id:', newColumns[0]);

    // Check foreign key
    const [foreignKeys] = await connection.execute(`
      SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = 'prevsaude'
      AND TABLE_NAME = 'lancamentos'
      AND COLUMN_NAME = 'usuario_id'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    console.log('Chave estrangeira criada:', foreignKeys[0] || 'Não encontrada');

    console.log('🎉 Script executado com sucesso!');
    console.log('✅ usuario_id agora é INT e tem chave estrangeira adequada');

  } catch (error) {
    console.error('❌ Erro ao executar script:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão fechada');
    }
  }
}

// Execute the script
fixUsuarioId().catch(console.error);