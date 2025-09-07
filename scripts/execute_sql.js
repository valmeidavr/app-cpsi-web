const mysql = require('mysql2/promise');

async function executeSQL() {
  const connection = await mysql.createConnection({
    host: '92.118.58.75',
    user: 'root',
    password: 'root',
    port: 3306,
    database: 'prevsaude'
  });

  try {
    console.log('🔧 Conectando ao banco de dados...');
    
    // Adicionar campo id na tabela usuarios
    console.log('📝 Adicionando campo id na tabela usuarios...');
    await connection.execute(`
      ALTER TABLE usuarios 
      ADD COLUMN IF NOT EXISTS id INT AUTO_INCREMENT PRIMARY KEY FIRST
    `);
    console.log('✅ Campo id adicionado na tabela usuarios');

    // Adicionar campo id na tabela usuariogrupo
    console.log('📝 Adicionando campo id na tabela usuariogrupo...');
    await connection.execute(`
      ALTER TABLE usuariogrupo 
      ADD COLUMN IF NOT EXISTS id INT AUTO_INCREMENT PRIMARY KEY FIRST
    `);
    console.log('✅ Campo id adicionado na tabela usuariogrupo');

    // Verificar estrutura das tabelas
    console.log('\n📋 Estrutura da tabela usuarios:');
    const [usuariosStructure] = await connection.execute('DESCRIBE usuarios');
    console.table(usuariosStructure);

    console.log('\n📋 Estrutura da tabela usuariogrupo:');
    const [usuariogrupoStructure] = await connection.execute('DESCRIBE usuariogrupo');
    console.table(usuariogrupoStructure);

    console.log('\n✅ Script executado com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao executar script:', error);
  } finally {
    await connection.end();
  }
}

executeSQL();
