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

async function createAdminUser() {
  let connection;
  
  try {
    console.log('🔍 Conectando ao banco de dados...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexão estabelecida com sucesso!');

    // Verificar se as tabelas existem
    console.log('\n📋 Verificando estrutura do banco...');
    
    // Verificar tabela usuarios
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
    
    let sistemaId = 1087; // ID padrão do sistema CPSI
    if (sistemaCPSI.length === 0) {
      console.log('❌ Sistema CPSI não encontrado. Criando...');
      const [result] = await connection.execute(
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
      senha: 'admin123', // Senha padrão
      status: 'Ativo'
    };

    console.log('\n👤 Verificando se usuário admin já existe...');
    const [existingUser] = await connection.execute(
      'SELECT login FROM usuarios WHERE login = ?',
      [adminData.login]
    );

    if (existingUser.length > 0) {
      console.log('⚠️  Usuário admin já existe! Atualizando...');
      
      // Hash da senha
      const hashedPassword = await bcrypt.hash(adminData.senha, 10);
      
      // Atualizar usuário existente
      await connection.execute(
        'UPDATE usuarios SET nome = ?, email = ?, senha = ?, status = ? WHERE login = ?',
        [adminData.nome, adminData.email, hashedPassword, adminData.status, adminData.login]
      );
      console.log('✅ Usuário admin atualizado!');
    } else {
      console.log('❌ Usuário admin não encontrado. Criando...');
      
      // Hash da senha
      const hashedPassword = await bcrypt.hash(adminData.senha, 10);
      
      // Inserir novo usuário
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
      // Atualizar nível para administrador
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

