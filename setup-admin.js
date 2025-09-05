const { createAdminUser } = require('./create-admin-user');
const { testAdminUser } = require('./test-admin-user');

async function setupAdmin() {
  console.log('🚀 Iniciando configuração do usuário administrador...\n');
  
  try {
    // Verificar variáveis de ambiente
    console.log('🔧 Verificando configurações...');
    console.log(`   MYSQL_HOST: ${process.env.MYSQL_HOST || 'localhost'}`);
    console.log(`   MYSQL_PORT: ${process.env.MYSQL_PORT || '3306'}`);
    console.log(`   MYSQL_USER: ${process.env.MYSQL_USER || 'root'}`);
    console.log(`   MYSQL_PASSWORD: ${process.env.MYSQL_PASSWORD || 'root'}`);
    console.log(`   MYSQL_ACCESS_DB: ${process.env.MYSQL_ACCESS_DB || 'cpsi_acesso'}`);
    
    console.log('\n📝 Criando usuário administrador...');
    await createAdminUser();
    
    console.log('\n🧪 Testando configuração...');
    await testAdminUser();
    
    console.log('\n🎉 Configuração concluída com sucesso!');
    console.log('\n📋 Resumo:');
    console.log('   ✅ Usuário admin criado/atualizado');
    console.log('   ✅ Permissões de administrador configuradas');
    console.log('   ✅ Autenticação testada e funcionando');
    console.log('\n🔑 Credenciais para login:');
    console.log('   Usuário: admin');
    console.log('   Senha: admin123');
    console.log('\n⚠️  IMPORTANTE: Altere a senha padrão após o primeiro login!');
    
  } catch (error) {
    console.error('\n❌ Erro na configuração:', error);
    console.log('\n🔧 Verifique:');
    console.log('   1. Se o MySQL está rodando');
    console.log('   2. Se as credenciais do banco estão corretas');
    console.log('   3. Se o banco de dados existe');
    console.log('   4. Se as variáveis de ambiente estão configuradas');
    throw error;
  }
}

// Executar o script
if (require.main === module) {
  setupAdmin()
    .then(() => {
      console.log('\n✅ Setup concluído com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro no setup:', error);
      process.exit(1);
    });
}

module.exports = { setupAdmin };

