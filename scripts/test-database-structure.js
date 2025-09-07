const mysql = require('mysql2/promise');

// Configuração do banco
const dbConfig = {
  host: '92.118.58.75',
  user: 'root',
  password: 'root',
  port: 3306,
  database: 'prevsaude'
};

// Tabelas esperadas baseadas nas rotas da API
const expectedTables = [
  'usuarios',
  'clientes', 
  'convenios',
  'especialidades',
  'procedimentos',
  'prestadores',
  'unidades',
  'turmas',
  'agendas',
  'alocacoes',
  'expediente',
  'lancamentos',
  'plano_contas',
  'caixa',
  'tabela_faturamentos',
  'valor_procedimento',
  'alunos_turmas',
  'convenios_clientes',
  'usuariogrupo'
];

async function testDatabaseStructure() {
  let connection;
  
  try {
    console.log('🔍 Conectando ao banco de dados prevsaude...');
    connection = await mysql.createConnection(dbConfig);
    await connection.ping();
    console.log('✅ Conexão estabelecida com sucesso!\n');
    
    // Listar todas as tabelas
    console.log('📋 Verificando tabelas existentes...');
    const [tables] = await connection.execute(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = ? ORDER BY table_name",
      ['prevsaude']
    );
    
    const existingTables = tables.map(t => t.table_name);
    console.log(`\n📊 Total de tabelas encontradas: ${existingTables.length}`);
    
    // Verificar tabelas esperadas
    console.log('\n🔍 Verificando tabelas esperadas:');
    const missingTables = [];
    const foundTables = [];
    
    for (const expectedTable of expectedTables) {
      if (existingTables.includes(expectedTable)) {
        console.log(`✅ ${expectedTable} - Encontrada`);
        foundTables.push(expectedTable);
      } else {
        console.log(`❌ ${expectedTable} - NÃO encontrada`);
        missingTables.push(expectedTable);
      }
    }
    
    // Verificar tabelas extras
    const extraTables = existingTables.filter(table => !expectedTables.includes(table));
    if (extraTables.length > 0) {
      console.log('\n📋 Tabelas extras encontradas:');
      extraTables.forEach(table => {
        console.log(`ℹ️ ${table} - Não esperada mas existe`);
      });
    }
    
    // Testar estrutura de algumas tabelas principais
    console.log('\n🔍 Verificando estrutura das tabelas principais...');
    
    const mainTables = ['usuarios', 'clientes', 'convenios', 'especialidades'];
    
    for (const tableName of mainTables) {
      if (existingTables.includes(tableName)) {
        try {
          const [structure] = await connection.execute(`DESCRIBE ${tableName}`);
          console.log(`\n📋 Estrutura da tabela ${tableName}:`);
          structure.forEach(column => {
            console.log(`  - ${column.Field} (${column.Type}) ${column.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${column.Key ? `[${column.Key}]` : ''}`);
          });
          
          // Contar registros
          const [count] = await connection.execute(`SELECT COUNT(*) as total FROM ${tableName}`);
          console.log(`  📊 Total de registros: ${count[0].total}`);
          
        } catch (error) {
          console.log(`❌ Erro ao verificar estrutura da tabela ${tableName}: ${error.message}`);
        }
      }
    }
    
    // Testar algumas consultas básicas
    console.log('\n🔍 Testando consultas básicas...');
    
    // Testar tabela usuarios
    if (existingTables.includes('usuarios')) {
      try {
        const [users] = await connection.execute('SELECT login, nome, status FROM usuarios LIMIT 5');
        console.log('\n👥 Usuários encontrados:');
        users.forEach(user => {
          console.log(`  - ${user.login} (${user.nome}) - Status: ${user.status}`);
        });
      } catch (error) {
        console.log(`❌ Erro ao consultar usuários: ${error.message}`);
      }
    }
    
    // Testar tabela usuariogrupo
    if (existingTables.includes('usuariogrupo')) {
      try {
        const [groups] = await connection.execute('SELECT usuario_login, grupo_id FROM usuariogrupo LIMIT 10');
        console.log('\n👥 Grupos de usuários:');
        groups.forEach(group => {
          console.log(`  - ${group.usuario_login} -> Grupo ${group.grupo_id}`);
        });
      } catch (error) {
        console.log(`❌ Erro ao consultar grupos: ${error.message}`);
      }
    }
    
    // Relatório final
    console.log('\n📊 RELATÓRIO FINAL:');
    console.log(`✅ Tabelas encontradas: ${foundTables.length}/${expectedTables.length}`);
    console.log(`❌ Tabelas faltando: ${missingTables.length}`);
    console.log(`ℹ️ Tabelas extras: ${extraTables.length}`);
    
    if (missingTables.length > 0) {
      console.log('\n⚠️ TABELAS FALTANDO:');
      missingTables.forEach(table => console.log(`  - ${table}`));
    }
    
    const coverage = ((foundTables.length / expectedTables.length) * 100).toFixed(1);
    console.log(`\n📈 Cobertura de tabelas: ${coverage}%`);
    
    if (coverage >= 80) {
      console.log('✅ Banco de dados está bem estruturado!');
    } else if (coverage >= 60) {
      console.log('⚠️ Banco de dados tem estrutura parcial. Algumas funcionalidades podem não funcionar.');
    } else {
      console.log('❌ Banco de dados tem estrutura insuficiente. Muitas funcionalidades não funcionarão.');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Executar teste
testDatabaseStructure().catch(console.error);
