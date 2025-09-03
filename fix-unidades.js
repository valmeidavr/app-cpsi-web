const mysql = require('mysql2/promise');

// Configuração do banco
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'cpsi_acesso'
};

async function fixUnidades() {
  let connection;
  
  try {
    console.log('🔍 Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexão estabelecida com sucesso!');

    // Verificar estrutura da tabela unidades
    console.log('\n📋 Verificando estrutura da tabela unidades...');
    const [columns] = await connection.execute('DESCRIBE unidades');
    console.log('Colunas atuais:');
    columns.forEach(col => {
      console.log(`   - ${col.Field}: ${col.Type}`);
    });

    // Adicionar coluna nome se não existir
    console.log('\n🔧 Adicionando coluna nome...');
    await connection.execute(`
      ALTER TABLE unidades 
      ADD COLUMN nome VARCHAR(150) NOT NULL 
      AFTER id
    `);
    console.log('✅ Coluna nome adicionada!');

    // Atualizar dados existentes
    console.log('\n📝 Atualizando dados existentes...');
    await connection.execute(`
      UPDATE unidades 
      SET nome = descricao
    `);
    console.log('✅ Dados atualizados!');

    // Verificar resultado
    console.log('\n🔍 Verificando dados atualizados...');
    const [unidades] = await connection.execute('SELECT id, nome, descricao FROM unidades');
    unidades.forEach(unidade => {
      console.log(`   ID ${unidade.id}: ${unidade.nome} (${unidade.descricao})`);
    });

    console.log('\n🎉 Tabela unidades corrigida com sucesso!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão com banco encerrada.');
    }
  }
}

// Executar correção
fixUnidades();
