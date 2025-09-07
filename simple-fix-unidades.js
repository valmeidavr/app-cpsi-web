const mysql = require('mysql2/promise');

// Configuração do banco
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'cpsi_acesso'
};

async function simpleFixUnidades() {
  let connection;
  
  try {
    console.log('🔍 Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexão estabelecida com sucesso!');

    // Verificar se a coluna nome já existe
    console.log('\n📋 Verificando se coluna nome existe...');
    const [columns] = await connection.execute('DESCRIBE unidades');
    const hasNome = columns.some(col => col.Field === 'nome');
    
    if (hasNome) {
      console.log('✅ Coluna nome já existe!');
    } else {
      console.log('❌ Coluna nome não existe, adicionando...');
      
      // Adicionar coluna nome
      await connection.execute(`
        ALTER TABLE unidades 
        ADD COLUMN nome VARCHAR(150) 
        AFTER id
      `);
      console.log('✅ Coluna nome adicionada!');
      
      // Atualizar dados
      await connection.execute(`
        UPDATE unidades 
        SET nome = descricao
      `);
      console.log('✅ Dados atualizados!');
    }

    // Verificar resultado
    console.log('\n🔍 Verificando dados...');
    const [unidades] = await connection.execute('SELECT id, nome, descricao FROM unidades LIMIT 5');
    unidades.forEach(unidade => {
      console.log(`   ID ${unidade.id}: ${unidade.nome || 'N/A'} (${unidade.descricao})`);
    });

    console.log('\n🎉 Correção concluída!');

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
simpleFixUnidades();
