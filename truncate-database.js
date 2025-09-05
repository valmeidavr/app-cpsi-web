const mysql = require('mysql2/promise');

// Configurações do banco de dados
const dbConfig = {
  host: process.env.MYSQL_GESTOR_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_GESTOR_PASSWORD || '',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  database: process.env.MYSQL_GESTOR_DB || 'gestor',
};

// Tabelas que NÃO devem ser truncadas (preservar dados)
const PRESERVE_TABLES = [
  'usuarios',
  'grupo', 
  'sistema',
  'usuariogrupo',
  'usuario_sistema'
];

// Tabela que deve ser removida completamente
const DROP_TABLE = 'sistemas';

async function truncateDatabase() {
  let connection;
  
  try {
    console.log('🔌 Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexão estabelecida com sucesso!');

    // Desabilitar verificação de foreign keys
    console.log('🔓 Desabilitando verificação de foreign keys...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    console.log('✅ Foreign keys desabilitadas');

    // Listar todas as tabelas do banco
    console.log('📋 Listando todas as tabelas...');
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    console.log(`📊 Encontradas ${tableNames.length} tabelas:`);
    tableNames.forEach(table => console.log(`  - ${table}`));

    // Separar tabelas para truncate e para drop
    const tablesToTruncate = tableNames.filter(table => 
      !PRESERVE_TABLES.includes(table) && table !== DROP_TABLE
    );
    
    const tablesToDrop = tableNames.filter(table => table === DROP_TABLE);

    console.log('\n🗑️  Tabelas que serão TRUNCADAS (dados removidos):');
    tablesToTruncate.forEach(table => console.log(`  - ${table}`));
    
    console.log('\n❌ Tabelas que serão REMOVIDAS completamente:');
    tablesToDrop.forEach(table => console.log(`  - ${table}`));
    
    console.log('\n🔒 Tabelas que serão PRESERVADAS:');
    PRESERVE_TABLES.forEach(table => console.log(`  - ${table}`));

    // Confirmar antes de executar
    console.log('\n⚠️  ATENÇÃO: Esta operação irá:');
    console.log('   - Remover TODOS os dados das tabelas listadas para truncate');
    console.log('   - Remover completamente as tabelas listadas para drop');
    console.log('   - Preservar os dados das tabelas de usuários e grupos');
    console.log('\n🤔 Deseja continuar? (Pressione Ctrl+C para cancelar)');
    
    // Aguardar 5 segundos para o usuário cancelar se quiser
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Executar TRUNCATE nas tabelas selecionadas
    console.log('\n🚀 Iniciando operações...');
    
    for (const table of tablesToTruncate) {
      try {
        console.log(`🗑️  Truncando tabela: ${table}`);
        await connection.execute(`TRUNCATE TABLE \`${table}\``);
        console.log(`✅ Tabela ${table} truncada com sucesso`);
      } catch (error) {
        console.error(`❌ Erro ao truncar tabela ${table}:`, error.message);
      }
    }

    // Executar DROP nas tabelas selecionadas
    for (const table of tablesToDrop) {
      try {
        console.log(`❌ Removendo tabela: ${table}`);
        await connection.execute(`DROP TABLE \`${table}\``);
        console.log(`✅ Tabela ${table} removida com sucesso`);
      } catch (error) {
        console.error(`❌ Erro ao remover tabela ${table}:`, error.message);
      }
    }

    // Reabilitar verificação de foreign keys
    console.log('\n🔒 Reabilitando verificação de foreign keys...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Foreign keys reabilitadas');

    // Verificar resultado final
    console.log('\n📊 Verificando resultado final...');
    const [finalTables] = await connection.execute('SHOW TABLES');
    const finalTableNames = finalTables.map(row => Object.values(row)[0]);
    
    console.log(`📋 Tabelas restantes (${finalTableNames.length}):`);
    finalTableNames.forEach(table => console.log(`  - ${table}`));

    // Verificar contagem de registros nas tabelas preservadas
    console.log('\n📈 Contagem de registros nas tabelas preservadas:');
    for (const table of PRESERVE_TABLES) {
      if (finalTableNames.includes(table)) {
        try {
          const [count] = await connection.execute(`SELECT COUNT(*) as total FROM \`${table}\``);
          console.log(`  - ${table}: ${count[0].total} registros`);
        } catch (error) {
          console.log(`  - ${table}: Erro ao contar registros - ${error.message}`);
        }
      }
    }

    console.log('\n🎉 Operação concluída com sucesso!');
    console.log('✅ Dados das tabelas de usuários e grupos foram preservados');
    console.log('✅ Dados das demais tabelas foram removidos');
    console.log('✅ Tabela "sistemas" foi removida completamente');

  } catch (error) {
    console.error('❌ Erro durante a operação:', error);
    
    // Tentar reabilitar foreign keys em caso de erro
    if (connection) {
      try {
        await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
        console.log('🔒 Foreign keys reabilitadas após erro');
      } catch (fkError) {
        console.error('❌ Erro ao reabilitar foreign keys:', fkError.message);
      }
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexão com banco encerrada');
    }
  }
}

// Executar o script
if (require.main === module) {
  truncateDatabase();
}

module.exports = { truncateDatabase };
