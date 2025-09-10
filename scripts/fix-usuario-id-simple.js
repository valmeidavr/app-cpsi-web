const mysql = require('mysql2/promise');
require('dotenv').config();

async function addForeignKey() {
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

    // Check current structure
    console.log('📋 Verificando estrutura atual...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'prevsaude' 
      AND TABLE_NAME = 'lancamentos' 
      AND COLUMN_NAME = 'usuario_id'
    `);
    
    console.log('Estrutura atual do usuario_id:', columns[0]);

    // Check existing foreign keys
    console.log('🔍 Verificando chaves estrangeiras existentes...');
    const [foreignKeys] = await connection.execute(`
      SELECT CONSTRAINT_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = 'prevsaude'
      AND TABLE_NAME = 'lancamentos'
      AND COLUMN_NAME = 'usuario_id'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);

    if (foreignKeys.length > 0) {
      console.log('✅ Chave estrangeira já existe:', foreignKeys[0].CONSTRAINT_NAME);
    } else {
      console.log('➕ Adicionando chave estrangeira...');
      
      // First, ensure all usuario_id values reference valid users or are NULL
      console.log('🔧 Verificando dados inválidos...');
      const [invalidUsers] = await connection.execute(`
        SELECT DISTINCT l.usuario_id 
        FROM lancamentos l 
        LEFT JOIN usuarios u ON l.usuario_id = u.id 
        WHERE l.usuario_id IS NOT NULL AND u.id IS NULL
      `);

      if (invalidUsers.length > 0) {
        console.log('⚠️  Encontrados IDs de usuário inválidos:', invalidUsers.map(r => r.usuario_id));
        
        // Get admin user ID
        const [adminUser] = await connection.execute(`
          SELECT id FROM usuarios WHERE login = 'admin' LIMIT 1
        `);
        
        if (adminUser.length > 0) {
          const adminId = adminUser[0].id;
          console.log(`🔄 Corrigindo para admin ID: ${adminId}...`);
          
          await connection.execute(`
            UPDATE lancamentos 
            SET usuario_id = ? 
            WHERE usuario_id NOT IN (SELECT id FROM usuarios) 
            AND usuario_id IS NOT NULL
          `, [adminId]);
          
          console.log('✅ Dados inválidos corrigidos');
        }
      }

      // First, modify column to allow NULL
      console.log('🔧 Alterando coluna para aceitar NULL...');
      await connection.execute(`
        ALTER TABLE lancamentos 
        MODIFY COLUMN usuario_id INT NULL
      `);
      
      // Add foreign key constraint
      await connection.execute(`
        ALTER TABLE lancamentos 
        ADD CONSTRAINT fk_lancamentos_usuario 
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
      `);
      
      console.log('✅ Chave estrangeira adicionada com sucesso');
    }

    // Update index if needed
    console.log('📊 Verificando índices...');
    const [indexes] = await connection.execute(`
      SHOW INDEX FROM lancamentos WHERE Column_name = 'usuario_id'
    `);
    
    if (indexes.length === 0) {
      console.log('➕ Criando índice...');
      await connection.execute(`
        CREATE INDEX idx_lancamentos_usuario ON lancamentos(usuario_id)
      `);
      console.log('✅ Índice criado');
    } else {
      console.log('✅ Índice já existe');
    }

    console.log('🎉 Configuração finalizada com sucesso!');

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
addForeignKey().catch(console.error);