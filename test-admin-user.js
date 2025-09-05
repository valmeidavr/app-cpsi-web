const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// Configuração do banco de dados
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'root',
  database: process.env.MYSQL_ACCESS_DB || 'cpsi_acesso'
};

async function testAdminUser() {
  let connection;
  
  try {
    console.log('🔍 Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexão estabelecida com sucesso!');

    // Verificar estrutura das tabelas
    console.log('\n📋 Verificando estrutura das tabelas...');
    
    const [tables] = await connection.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ?
      ORDER BY table_name
    `, [dbConfig.database]);
    
    console.log('📊 Tabelas encontradas:');
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });

    // Verificar usuário admin
    console.log('\n👤 Verificando usuário admin...');
    const [adminUser] = await connection.execute(
      'SELECT login, nome, email, status FROM usuarios WHERE login = ?',
      ['admin']
    );

    if (adminUser.length === 0) {
      console.log('❌ Usuário admin não encontrado!');
      return;
    }

    const user = adminUser[0];
    console.log('✅ Usuário admin encontrado:');
    console.log(`   Login: ${user.login}`);
    console.log(`   Nome: ${user.nome}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Status: ${user.status}`);

    // Verificar permissões do usuário
    console.log('\n🔐 Verificando permissões do usuário...');
    const [permissions] = await connection.execute(`
      SELECT us.sistemas_id, us.nivel, s.nome as sistema_nome 
      FROM usuario_sistema us 
      INNER JOIN sistemas s ON us.sistemas_id = s.id 
      WHERE us.usuarios_login = ?
    `, [user.login]);

    if (permissions.length === 0) {
      console.log('❌ Nenhuma permissão encontrada para o usuário admin!');
    } else {
      console.log('✅ Permissões encontradas:');
      permissions.forEach(perm => {
        console.log(`   - Sistema: ${perm.sistema_nome} (ID: ${perm.sistemas_id})`);
        console.log(`   - Nível: ${perm.nivel}`);
      });
    }

    // Testar autenticação
    console.log('\n🔑 Testando autenticação...');
    const [userWithPassword] = await connection.execute(
      'SELECT login, senha, nome, email FROM usuarios WHERE login = ? AND status = ?',
      ['admin', 'Ativo']
    );

    if (userWithPassword.length === 0) {
      console.log('❌ Usuário admin não encontrado ou inativo!');
      return;
    }

    const userData = userWithPassword[0];
    console.log('✅ Usuário encontrado para autenticação');

    // Testar senha
    const testPassword = 'admin123';
    console.log(`🔐 Testando senha: ${testPassword}`);
    
    try {
      // Verificar se o hash começa com $2y$, converter para $2a$ para compatibilidade
      let hashToCompare = userData.senha;
      if (hashToCompare.startsWith('$2y$')) {
        hashToCompare = hashToCompare.replace('$2y$', '$2a$');
        console.log('🔄 Hash convertido para compatibilidade');
      }
      
      const isPasswordValid = await bcrypt.compare(testPassword, hashToCompare);
      
      if (isPasswordValid) {
        console.log('✅ Senha válida! Autenticação funcionando corretamente.');
      } else {
        console.log('❌ Senha inválida! Verifique a configuração.');
      }
    } catch (error) {
      console.error('❌ Erro ao verificar senha:', error);
    }

    // Verificar todos os usuários
    console.log('\n📊 Listando todos os usuários...');
    const [allUsers] = await connection.execute(
      'SELECT login, nome, email, status FROM usuarios ORDER BY login'
    );
    
    console.log(`Total de usuários: ${allUsers.length}`);
    allUsers.forEach((u, index) => {
      console.log(`   ${index + 1}. ${u.login} - ${u.nome} (${u.status})`);
    });

  } catch (error) {
    console.error('❌ Erro ao testar usuário admin:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexão com banco de dados fechada.');
    }
  }
}

// Executar o script
if (require.main === module) {
  testAdminUser()
    .then(() => {
      console.log('\n✅ Teste executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro na execução do teste:', error);
      process.exit(1);
    });
}

module.exports = { testAdminUser };

