const mysql = require('mysql2/promise');

// Configuração do banco
const dbConfig = {
  host: '92.118.58.75',
  user: 'root',
  password: 'root',
  port: 3306,
  database: 'prevsaude'
};

// Lista de todas as rotas da API para testar
const apiRoutes = [
  // Rotas de autenticação
  { method: 'GET', path: '/api/auth/session', description: 'Verificar sessão' },
  { method: 'POST', path: '/api/auth/callback/credentials', description: 'Login' },
  
  // Rotas de usuários
  { method: 'GET', path: '/api/usuarios', description: 'Listar usuários' },
  { method: 'POST', path: '/api/usuarios', description: 'Criar usuário' },
  { method: 'GET', path: '/api/usuarios/sistemas', description: 'Sistemas do usuário' },
  
  // Rotas de clientes
  { method: 'GET', path: '/api/clientes', description: 'Listar clientes' },
  { method: 'POST', path: '/api/clientes', description: 'Criar cliente' },
  { method: 'GET', path: '/api/clientes/findByCpf', description: 'Buscar cliente por CPF' },
  { method: 'GET', path: '/api/clientes/findByEmail', description: 'Buscar cliente por email' },
  
  // Rotas de convênios
  { method: 'GET', path: '/api/convenios', description: 'Listar convênios' },
  { method: 'POST', path: '/api/convenios', description: 'Criar convênio' },
  
  // Rotas de especialidades
  { method: 'GET', path: '/api/especialidades', description: 'Listar especialidades' },
  { method: 'POST', path: '/api/especialidades', description: 'Criar especialidade' },
  
  // Rotas de procedimentos
  { method: 'GET', path: '/api/procedimentos', description: 'Listar procedimentos' },
  { method: 'POST', path: '/api/procedimentos', description: 'Criar procedimento' },
  { method: 'GET', path: '/api/procedimentos/convenio', description: 'Procedimentos por convênio' },
  
  // Rotas de prestadores
  { method: 'GET', path: '/api/prestadores', description: 'Listar prestadores' },
  { method: 'POST', path: '/api/prestadores', description: 'Criar prestador' },
  { method: 'GET', path: '/api/prestadores/findByCpf', description: 'Buscar prestador por CPF' },
  
  // Rotas de unidades
  { method: 'GET', path: '/api/unidades', description: 'Listar unidades' },
  { method: 'POST', path: '/api/unidades', description: 'Criar unidade' },
  
  // Rotas de turmas
  { method: 'GET', path: '/api/turmas', description: 'Listar turmas' },
  { method: 'POST', path: '/api/turmas', description: 'Criar turma' },
  
  // Rotas de agendas
  { method: 'GET', path: '/api/agendas', description: 'Listar agendas' },
  { method: 'POST', path: '/api/agendas', description: 'Criar agenda' },
  
  // Rotas de alocações
  { method: 'GET', path: '/api/alocacoes', description: 'Listar alocações' },
  { method: 'POST', path: '/api/alocacoes', description: 'Criar alocação' },
  
  // Rotas de expedientes
  { method: 'GET', path: '/api/expediente', description: 'Listar expedientes' },
  { method: 'POST', path: '/api/expediente', description: 'Criar expediente' },
  
  // Rotas de lançamentos
  { method: 'GET', path: '/api/lancamentos', description: 'Listar lançamentos' },
  { method: 'POST', path: '/api/lancamentos', description: 'Criar lançamento' },
  
  // Rotas de plano de contas
  { method: 'GET', path: '/api/plano_contas', description: 'Listar plano de contas' },
  { method: 'POST', path: '/api/plano_contas', description: 'Criar plano de conta' },
  
  // Rotas de caixas
  { method: 'GET', path: '/api/caixa', description: 'Listar caixas' },
  { method: 'POST', path: '/api/caixa', description: 'Criar caixa' },
  
  // Rotas de tabela de faturamentos
  { method: 'GET', path: '/api/tabela_faturamentos', description: 'Listar tabela de faturamentos' },
  { method: 'POST', path: '/api/tabela_faturamentos', description: 'Criar tabela de faturamento' },
  
  // Rotas de valores de procedimentos
  { method: 'GET', path: '/api/valor-procedimento', description: 'Listar valores de procedimentos' },
  { method: 'POST', path: '/api/valor-procedimento', description: 'Criar valor de procedimento' },
  
  // Rotas de alunos turmas
  { method: 'GET', path: '/api/alunos_turmas', description: 'Listar alunos turmas' },
  { method: 'POST', path: '/api/alunos_turmas', description: 'Criar aluno turma' },
  
  // Rotas de convênios clientes
  { method: 'GET', path: '/api/convenios-clientes', description: 'Listar convênios clientes' },
  { method: 'POST', path: '/api/convenios-clientes', description: 'Criar convênio cliente' }
];

// Função para testar conexão com o banco
async function testDatabaseConnection() {
  try {
    console.log('🔍 Testando conexão com o banco de dados...');
    const connection = await mysql.createConnection(dbConfig);
    await connection.ping();
    console.log('✅ Conexão com banco de dados estabelecida com sucesso!');
    
    // Listar tabelas disponíveis
    const [tables] = await connection.execute(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = ?",
      ['prevsaude']
    );
    
    console.log('📋 Tabelas encontradas no banco prevsaude:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco de dados:', error.message);
    return false;
  }
}

// Função para testar uma rota específica
async function testRoute(baseUrl, route) {
  try {
    const url = `${baseUrl}${route.path}`;
    console.log(`\n🔍 Testando ${route.method} ${route.path} - ${route.description}`);
    
    const options = {
      method: route.method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    // Para rotas POST, adicionar dados de teste
    if (route.method === 'POST') {
      options.body = JSON.stringify({});
    }
    
    const response = await fetch(url, options);
    
    if (response.ok) {
      console.log(`✅ ${route.method} ${route.path} - Status: ${response.status}`);
      return { success: true, status: response.status };
    } else {
      console.log(`⚠️ ${route.method} ${route.path} - Status: ${response.status}`);
      return { success: false, status: response.status };
    }
  } catch (error) {
    console.log(`❌ ${route.method} ${route.path} - Erro: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Função principal de teste
async function runTests() {
  console.log('🚀 Iniciando testes das rotas da API...\n');
  
  // Testar conexão com banco
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.log('\n❌ Não foi possível conectar ao banco. Testes abortados.');
    return;
  }
  
  console.log('\n🌐 Testando rotas da API...');
  
  const baseUrl = 'http://localhost:3000';
  const results = {
    total: apiRoutes.length,
    success: 0,
    failed: 0,
    errors: []
  };
  
  for (const route of apiRoutes) {
    const result = await testRoute(baseUrl, route);
    
    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push({
        route: route.path,
        method: route.method,
        status: result.status,
        error: result.error
      });
    }
    
    // Pequena pausa entre requisições
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Relatório final
  console.log('\n📊 RELATÓRIO FINAL DOS TESTES:');
  console.log(`Total de rotas testadas: ${results.total}`);
  console.log(`✅ Sucessos: ${results.success}`);
  console.log(`❌ Falhas: ${results.failed}`);
  console.log(`📈 Taxa de sucesso: ${((results.success / results.total) * 100).toFixed(1)}%`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ ROTAS COM PROBLEMAS:');
    results.errors.forEach(error => {
      console.log(`  - ${error.method} ${error.route} (Status: ${error.status})`);
    });
  }
  
  console.log('\n✅ Testes concluídos!');
}

// Executar testes
runTests().catch(console.error);
