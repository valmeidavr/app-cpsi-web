const mysql = require('mysql2/promise');

// Configuração do banco
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'cpsi_acesso'
};

async function recreateUnidades() {
  let connection;
  
  try {
    console.log('🔍 Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexão estabelecida com sucesso!');

    // Verificar dados existentes
    console.log('\n📋 Verificando dados existentes...');
    const [existingData] = await connection.execute('SELECT * FROM unidades');
    console.log(`Encontrados ${existingData.length} registros existentes`);

    // Fazer backup dos dados
    const backupData = existingData.map(row => ({
      id: row.id,
      descricao: row.descricao,
      telefone: row.telefone,
      status: row.status
    }));

    // Remover foreign keys temporariamente
    console.log('\n🔧 Removendo foreign keys...');
    try {
      await connection.execute('ALTER TABLE alocacoes DROP FOREIGN KEY alocacoes_ibfk_1');
    } catch (e) {
      console.log('Foreign key já removida ou não existe');
    }

    // Recriar tabela unidades
    console.log('\n🔄 Recriando tabela unidades...');
    await connection.execute('DROP TABLE IF EXISTS unidades');
    await connection.execute(`
      CREATE TABLE unidades (
        id INT(10) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(150) NOT NULL,
        descricao VARCHAR(150),
        telefone VARCHAR(15),
        status VARCHAR(7) NOT NULL DEFAULT 'Ativo',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela unidades recriada!');

    // Restaurar dados
    console.log('\n📝 Restaurando dados...');
    for (const data of backupData) {
      await connection.execute(`
        INSERT INTO unidades (id, nome, descricao, telefone, status) 
        VALUES (?, ?, ?, ?, ?)
      `, [data.id, data.descricao, data.descricao, data.telefone, data.status]);
    }
    console.log('✅ Dados restaurados!');

    // Recriar foreign key
    console.log('\n🔗 Recriando foreign key...');
    await connection.execute(`
      ALTER TABLE alocacoes 
      ADD CONSTRAINT alocacoes_ibfk_1 
      FOREIGN KEY (unidade_id) REFERENCES unidades(id)
    `);
    console.log('✅ Foreign key recriada!');

    // Verificar resultado
    console.log('\n🔍 Verificando resultado...');
    const [newData] = await connection.execute('SELECT id, nome, descricao FROM unidades');
    newData.forEach(unidade => {
      console.log(`   ID ${unidade.id}: ${unidade.nome} (${unidade.descricao})`);
    });

    console.log('\n🎉 Tabela unidades recriada com sucesso!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão com banco encerrada.');
    }
  }
}

// Executar recriação
recreateUnidades();
