const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// Configurações do banco gestor
const dbConfig = {
  host: process.env.MYSQL_GESTOR_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_GESTOR_PASSWORD || '',
  database: process.env.MYSQL_GESTOR_DB || 'gestor'
};

async function createAdminUser() {
  let connection;
  
  try {
    console.log('🔍 Conectando ao banco gestor...');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Port: ${dbConfig.port}`);
    console.log(`   User: ${dbConfig.user}`);
    console.log(`   Password: ${dbConfig.password ? '***' : '(vazio)'}`);
    console.log(`   Database: ${dbConfig.database}`);
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexão estabelecida com sucesso!');

    // Verificar se a tabela usuarios existe
    console.log('\n📋 Verificando tabela usuarios...');
    const [usuariosTable] = await connection.execute(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = 'usuarios'
    `, [dbConfig.database]);
    
    if (usuariosTable[0].count === 0) {
      console.log('❌ Tabela usuarios não encontrada. Criando...');
      await connection.execute(`
        CREATE TABLE usuarios (
          login VARCHAR(255) PRIMARY KEY,
          senha VARCHAR(255) NOT NULL,
          nome VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          status ENUM('Ativo', 'Inativo') DEFAULT 'Ativo'
        )
      `);
      console.log('✅ Tabela usuarios criada!');
    } else {
      console.log('✅ Tabela usuarios encontrada!');
    }

    // Verificar tabela usuario_sistema
    console.log('\n📋 Verificando tabela usuario_sistema...');
    const [usuarioSistemaTable] = await connection.execute(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = 'usuario_sistema'
    `, [dbConfig.database]);
    
    if (usuarioSistemaTable[0].count === 0) {
      console.log('❌ Tabela usuario_sistema não encontrada. Criando...');
      await connection.execute(`
        CREATE TABLE usuario_sistema (
          sistemas_id INT,
          usuarios_login VARCHAR(255),
          nivel VARCHAR(255),
          PRIMARY KEY (sistemas_id, usuarios_login)
        )
      `);
      console.log('✅ Tabela usuario_sistema criada!');
    } else {
      console.log('✅ Tabela usuario_sistema encontrada!');
    }

    // Verificar tabela sistemas
    console.log('\n📋 Verificando tabela sistemas...');
    const [sistemasTable] = await connection.execute(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = 'sistemas'
    `, [dbConfig.database]);
    
    if (sistemasTable[0].count === 0) {
      console.log('❌ Tabela sistemas não encontrada. Criando...');
      await connection.execute(`
        CREATE TABLE sistemas (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nome VARCHAR(255) NOT NULL
        )
      `);
      console.log('✅ Tabela sistemas criada!');
    } else {
      console.log('✅ Tabela sistemas encontrada!');
    }

    // Verificar se o sistema CPSI existe
    console.log('\n🔍 Verificando sistema CPSI...');
    const [sistemaCPSI] = await connection.execute(
      'SELECT id FROM sistemas WHERE nome = "sistemaCPSI" OR id = 1087'
    );
    
    let sistemaId = 1087;
    if (sistemaCPSI.length === 0) {
      console.log('❌ Sistema CPSI não encontrado. Criando...');
      await connection.execute(
        'INSERT INTO sistemas (id, nome) VALUES (?, ?)',
        [1087, 'sistemaCPSI']
      );
      console.log('✅ Sistema CPSI criado!');
    } else {
      sistemaId = sistemaCPSI[0].id;
      console.log('✅ Sistema CPSI encontrado!');
    }

    // Dados do usuário admin
    const adminData = {
      login: 'admin',
      nome: 'Administrador do Sistema',
      email: 'admin@cpsi.com',
      senha: 'admin123',
      status: 'Ativo'
    };

    console.log('\n👤 Verificando usuário admin...');
    const [existingUser] = await connection.execute(
      'SELECT login FROM usuarios WHERE login = ?',
      [adminData.login]
    );

    if (existingUser.length > 0) {
      console.log('⚠️  Usuário admin já existe! Atualizando...');
      
      const hashedPassword = await bcrypt.hash(adminData.senha, 10);
      
      await connection.execute(
        'UPDATE usuarios SET nome = ?, email = ?, senha = ?, status = ? WHERE login = ?',
        [adminData.nome, adminData.email, hashedPassword, adminData.status, adminData.login]
      );
      console.log('✅ Usuário admin atualizado!');
    } else {
      console.log('❌ Usuário admin não encontrado. Criando...');
      
      const hashedPassword = await bcrypt.hash(adminData.senha, 10);
      
      await connection.execute(
        'INSERT INTO usuarios (login, nome, email, senha, status) VALUES (?, ?, ?, ?, ?)',
        [adminData.login, adminData.nome, adminData.email, hashedPassword, adminData.status]
      );
      console.log('✅ Usuário admin criado!');
    }

    // Verificar/inserir permissão de administrador
    console.log('\n🔐 Configurando permissões de administrador...');
    const [existingPermission] = await connection.execute(
      'SELECT usuarios_login FROM usuario_sistema WHERE sistemas_id = ? AND usuarios_login = ?',
      [sistemaId, adminData.login]
    );

    if (existingPermission.length === 0) {
      await connection.execute(
        'INSERT INTO usuario_sistema (sistemas_id, usuarios_login, nivel) VALUES (?, ?, ?)',
        [sistemaId, adminData.login, 'Administrador']
      );
      console.log('✅ Permissão de administrador concedida!');
    } else {
      await connection.execute(
        'UPDATE usuario_sistema SET nivel = ? WHERE sistemas_id = ? AND usuarios_login = ?',
        ['Administrador', sistemaId, adminData.login]
      );
      console.log('✅ Permissão de administrador atualizada!');
    }

    // Listar todos os usuários existentes
    console.log('\n📊 Usuários existentes no banco:');
    const [allUsers] = await connection.execute(
      'SELECT login, nome, email, status FROM usuarios ORDER BY login'
    );
    
    console.log(`Total de usuários: ${allUsers.length}`);
    allUsers.forEach((u, index) => {
      console.log(`   ${index + 1}. ${u.login} - ${u.nome} (${u.status})`);
    });

    console.log('\n🎉 Usuário administrador criado com sucesso!');
    console.log('📋 Detalhes do usuário:');
    console.log(`   Login: ${adminData.login}`);
    console.log(`   Nome: ${adminData.nome}`);
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Senha: ${adminData.senha}`);
    console.log(`   Status: ${adminData.status}`);
    console.log(`   Nível: Administrador`);
    console.log(`   Sistema ID: ${sistemaId}`);

    console.log('\n🔑 Credenciais para login:');
    console.log(`   Usuário: ${adminData.login}`);
    console.log(`   Senha: ${adminData.senha}`);

    console.log('\n✅ Configuração concluída!');
    console.log(`   Banco: ${dbConfig.database}`);
    console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);

  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
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
  createAdminUser()
    .then(() => {
      console.log('\n✅ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro na execução do script:', error);
      process.exit(1);
    });
}

module.exports = { createAdminUser };

