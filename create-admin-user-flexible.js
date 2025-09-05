const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

// Configurações possíveis do banco de dados
const dbConfigs = [
  {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_ACCESS_DB || 'cpsi_acesso'
  },
  {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'cpsi_acesso'
  },
  {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'cpsi_acesso'
  },
  {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'password',
    database: 'cpsi_acesso'
  }
];

async function createAdminUser() {
  let connection;
  let successfulConfig = null;
  
  // Tentar diferentes configurações
  for (let i = 0; i < dbConfigs.length; i++) {
    const config = dbConfigs[i];
    console.log(`\n🔍 Tentativa ${i + 1}/${dbConfigs.length} - Testando configuração:`);
    console.log(`   Host: ${config.host}`);
    console.log(`   Port: ${config.port}`);
    console.log(`   User: ${config.user}`);
    console.log(`   Password: ${config.password ? '***' : '(vazio)'}`);
    console.log(`   Database: ${config.database}`);
    
    try {
      connection = await mysql.createConnection(config);
      console.log('✅ Conexão estabelecida com sucesso!');
      successfulConfig = config;
      break;
    } catch (error) {
      console.log(`❌ Falha na conexão: ${error.message}`);
      if (connection) {
        await connection.end();
        connection = null;
      }
    }
  }
  
  if (!connection) {
    throw new Error('Não foi possível conectar ao banco de dados com nenhuma das configurações testadas');
  }
  
  try {
    console.log('\n📋 Verificando estrutura do banco...');
    
    // Verificar se o banco existe
    const [databases] = await connection.execute('SHOW DATABASES');
    const dbExists = databases.some(db => db.Database === successfulConfig.database);
    
    if (!dbExists) {
      console.log(`❌ Banco de dados '${successfulConfig.database}' não encontrado. Criando...`);
      await connection.query(`CREATE DATABASE ${successfulConfig.database}`);
      await connection.query(`USE ${successfulConfig.database}`);
      console.log('✅ Banco de dados criado!');
    } else {
      console.log('✅ Banco de dados encontrado!');
      await connection.query(`USE ${successfulConfig.database}`);
    }

    // Verificar tabela usuarios
    const [usuariosTable] = await connection.execute(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = 'usuarios'
    `, [successfulConfig.database]);
    
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
    const [usuarioSistemaTable] = await connection.execute(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = 'usuario_sistema'
    `, [successfulConfig.database]);
    
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
    const [sistemasTable] = await connection.execute(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = 'sistemas'
    `, [successfulConfig.database]);
    
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

    console.log('\n✅ Configuração bem-sucedida!');
    console.log(`   Banco: ${successfulConfig.database}`);
    console.log(`   Host: ${successfulConfig.host}:${successfulConfig.port}`);

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
