import mysql from 'mysql2/promise'
import { dbSettings, cleanupIdleConnections } from './db-settings'

// Configurações do banco de dados a partir das variáveis de ambiente
const dbConfigGestor = {
  host: process.env.MYSQL_GESTOR_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_GESTOR_PASSWORD || 'root',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
}
const dbConfigACesso = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'root',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
}

// Conexão para database de acesso (somente leitura para autenticação)
export const createAccessConnection = async () => {
  return await mysql.createConnection({
    ...dbConfigACesso,
    database: process.env.MYSQL_ACCESS_DB || 'cpsi_acesso',
  })
}

// Conexão para database GESTOR-nova (database principal da aplicação)
export const createGestorConnection = async () => {
  return await mysql.createConnection({
    ...dbConfigGestor,
    database: process.env.MYSQL_GESTOR_DB || 'gestor',
  })
}

// Pool de conexões OTIMIZADO com configurações do ambiente
export const accessPool = mysql.createPool({
  ...dbConfigACesso,
  database: process.env.MYSQL_ACCESS_DB || 'cpsi_acesso',
  ...dbSettings.pool,
})

export const gestorPool = mysql.createPool({
  ...dbConfigGestor,
  database: process.env.MYSQL_GESTOR_DB || 'gestor',
  ...dbSettings.pool,
})

// Limpeza automática de conexões ociosas a cada 30 segundos
setInterval(() => {
  cleanupIdleConnections(accessPool);
  cleanupIdleConnections(gestorPool);
}, 30000);

// Função para fechar o pool quando necessário
export const closePools = async () => {
  try {
    await accessPool.end()
    await gestorPool.end()
    console.log('Pools de conexão fechados com sucesso')
  } catch (error) {
    console.error('Erro ao fechar pools:', error)
  }
}

// Função para executar queries com retry automático OTIMIZADA
export const executeWithRetry = async <T>(
  pool: mysql.Pool,
  query: string,
  params: any[] = []
): Promise<T> => {
  let lastError: any
  
  for (let attempt = 1; attempt <= dbSettings.retry.maxRetries; attempt++) {
    try {
      const [result] = await pool.execute(query, params)
      return result as T
    } catch (error: any) {
      lastError = error
      
      // Se for erro de conexão, tentar novamente
      if (error.code === 'ER_CON_COUNT_ERROR' || error.code === 'ECONNRESET') {
        if (attempt < dbSettings.retry.maxRetries) {
          console.log(`Tentativa ${attempt} falhou, tentando novamente em ${dbSettings.retry.retryDelay}ms...`)
          await new Promise(resolve => setTimeout(resolve, dbSettings.retry.retryDelay))
          
          // Limpar conexões ociosas antes de tentar novamente
          cleanupIdleConnections(pool);
          continue
        }
      }
      
      // Para outros erros, não tentar novamente
      break
    }
  }
  
  throw lastError
}

