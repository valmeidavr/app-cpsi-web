import mysql from 'mysql2/promise'
import { dbSettings, cleanupIdleConnections } from './db-settings'

// Configurações do banco de dados a partir das variáveis de ambiente
const dbConfig = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
}

// Conexão para o banco prevsaude (único banco da aplicação)
export const createConnection = async () => {
  return await mysql.createConnection({
    ...dbConfig,
    database: process.env.MYSQL_DATABASE || 'prevsaude',
  })
}

// Alias para compatibilidade com código existente
export const createAccessConnection = createConnection
export const createGestorConnection = createConnection

// Pool de conexões OTIMIZADO com configurações do ambiente
export const pool = mysql.createPool({
  ...dbConfig,
  database: process.env.MYSQL_DATABASE || 'prevsaude',
  ...dbSettings.pool,
})

// Alias para compatibilidade com código existente
export const accessPool = pool
export const gestorPool = pool


// Limpeza automática de conexões ociosas a cada 30 segundos
setInterval(() => {
  // Cast para o tipo esperado pela função cleanupIdleConnections
  cleanupIdleConnections(pool as unknown as { _freeConnections?: Array<{ release?: () => void }> });
}, 30000);

// Função para testar conexão com o banco
export const testConnection = async () => {
  try {
    console.log('🔍 Testando conexão com o banco de dados...')
    const connection = await createAccessConnection()
    await connection.ping()
    await connection.end()
    console.log('✅ Conexão com banco de dados estabelecida com sucesso!')
    return true
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco de dados:', error)
    return false
  }
}

// Função para listar tabelas do banco
export const listTables = async () => {
  try {
    console.log('🔍 Listando tabelas do banco de dados...')
    const [tables] = await pool.execute(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = ?",
      [process.env.MYSQL_DATABASE || 'prevsaude']
    )
    
    const tableNames = (tables as {table_name: string}[]).map(t => t.table_name)
    console.log('📋 Tabelas encontradas:', tableNames)
    return tableNames
  } catch (error) {
    console.error('❌ Erro ao listar tabelas:', error)
    return []
  }
}

// Função para fechar o pool quando necessário
export const closePools = async () => {
  try {
    await pool.end()
    console.log('Pool de conexão fechado com sucesso')
  } catch (error) {
    console.error('Erro ao fechar pool:', error)
  }
}

// Função para executar queries com retry automático OTIMIZADA
export const executeWithRetry = async <T>(
  pool: mysql.Pool,
  query: string,
  params: unknown[] = []
): Promise<T> => {
  let lastError: Error | undefined
  
  for (let attempt = 1; attempt <= dbSettings.retry.maxRetries; attempt++) {
    try {
      const [result] = await pool.execute(query, params)
      return result as T
    } catch (error) {
      lastError = error as Error
      
      // Se for erro de conexão, tentar novamente
      if ((error as { code?: string }).code === 'ER_CON_COUNT_ERROR' || (error as { code?: string }).code === 'ECONNRESET') {
        if (attempt < dbSettings.retry.maxRetries) {
          console.log(`Tentativa ${attempt} falhou, tentando novamente em ${dbSettings.retry.retryDelay}ms...`)
          await new Promise(resolve => setTimeout(resolve, dbSettings.retry.retryDelay))
          
          // Limpar conexões ociosas antes de tentar novamente
          cleanupIdleConnections(pool as unknown as { _freeConnections?: Array<{ release?: () => void }> });
          continue
        }
      }
      
      // Para outros erros, não tentar novamente
      break
    }
  }
  
  if (lastError) {
    throw lastError
  }
  
  throw new Error('Erro desconhecido durante a execução da query')
}

