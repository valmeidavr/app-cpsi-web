import mysql from 'mysql2/promise'
import { dbSettings, cleanupIdleConnections } from './db-settings'
const dbConfig = {
  host: process.env.DB_HOST || process.env.MYSQL_HOST || '127.0.0.1',
  user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || 'root',
  port: parseInt(process.env.DB_PORT || process.env.MYSQL_PORT || '3306'),
}
export const createConnection = async () => {
  return await mysql.createConnection({
    ...dbConfig,
    database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'prevsaude',
  })
}
console.log(dbConfig)
export const createAccessConnection = createConnection
export const createGestorConnection = createConnection
export const pool = mysql.createPool({
  ...dbConfig,
  database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'prevsaude',
  connectionLimit: 15,
  queueLimit: 30,
  waitForConnections: true,
  acquireTimeout: 45000,  // Increased from 30s to 45s
  timeout: 90000,         // Increased from 60s to 90s
  idleTimeout: 60000,     // Increased from 30s to 60s
  reconnect: true,
  maxReconnects: 5,       // Increased from 3 to 5
  keepAliveInitialDelay: 10000,  // 10s delay before first keepalive
  enableKeepAlive: true,
  // Additional connection options for better stability
  connectTimeout: 30000,  // 30s connection timeout
  pingInterval: 60000,    // Ping every 60s to keep connections alive
})
export const accessPool = pool
setInterval(() => {
  cleanupIdleConnections(pool as unknown as { _freeConnections?: Array<{ release?: () => void }> });
}, 30000);
export const testConnection = async () => {
  try {
    console.log('🔍 [MySQL] Testando conexão...')
    const connection = await createAccessConnection()
    await connection.ping()
    await connection.end()
    console.log('✅ [MySQL] Conexão testada com sucesso')
    return true
  } catch (error) {
    console.error('❌ [MySQL] Erro ao conectar com o banco de dados:', error)
    return false
  }
}

export const healthCheck = async () => {
  const startTime = Date.now()
  
  try {
    console.log('🏥 [MySQL] Iniciando health check...')
    
    const [result] = await executeWithRetry(pool, 'SELECT 1 as health_check, NOW() as server_time')
    const responseTime = Date.now() - startTime
    
    const status = {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      serverTime: (result as any)[0]?.server_time,
      poolInfo: {
        connectionLimit: pool.config.connectionLimit,
        queueLimit: pool.config.queueLimit,
        acquireTimeout: pool.config.acquireTimeout,
        timeout: pool.config.timeout,
      }
    }
    
    console.log('✅ [MySQL] Health check passou:', status)
    return status
    
  } catch (error) {
    const responseTime = Date.now() - startTime
    const status = {
      status: 'unhealthy',
      error: (error as Error).message,
      responseTime: `${responseTime}ms`,
      errorCode: (error as { code?: string }).code,
    }
    
    console.error('❌ [MySQL] Health check falhou:', status)
    return status
  }
}

export const getPoolStats = () => {
  try {
    // Tentar acessar estatísticas internas do pool (pode não funcionar em todas as versões)
    const poolStats = {
      config: {
        connectionLimit: pool.config.connectionLimit,
        queueLimit: pool.config.queueLimit,
        acquireTimeout: pool.config.acquireTimeout,
        timeout: pool.config.timeout,
        idleTimeout: pool.config.idleTimeout,
      },
      // As estatísticas de runtime podem não estar disponíveis
      runtime: {
        timestamp: new Date().toISOString(),
        note: 'Runtime stats may not be available in all mysql2 versions'
      }
    }
    
    console.log('📊 [MySQL] Pool stats:', poolStats)
    return poolStats
  } catch (error) {
    console.error('❌ [MySQL] Erro ao obter estatísticas do pool:', error)
    return null
  }
}
export const listTables = async () => {
  try {
    const [tables] = await pool.execute(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = ?",
      [process.env.DB_NAME || process.env.MYSQL_DATABASE || 'prevsaude']
    )
    return (tables as { table_name: string }[]).map(t => t.table_name)
  } catch (error) {
    console.error('Erro ao listar tabelas:', error)
    return []
  }
}
export const closePools = async () => {
  try {
    await pool.end()
  } catch (error) {
    console.error('Erro ao fechar pool:', error)
  }
}
export const executeWithRetry = async <T>(
  pool: mysql.Pool,
  query: string,
  params: unknown[] = []
): Promise<T> => {
  let lastError: Error | undefined
  
  for (let attempt = 1; attempt <= dbSettings.retry.maxRetries; attempt++) {
    try {
      console.log(`🔄 [MySQL] Tentativa ${attempt}/${dbSettings.retry.maxRetries} - Query: ${query.substring(0, 50)}...`)
      const [result] = await pool.execute(query, params)
      if (attempt > 1) {
        console.log(`✅ [MySQL] Sucesso na tentativa ${attempt}`)
      }
      return result as T
    } catch (error) {
      lastError = error as Error
      const errorCode = (error as { code?: string }).code
      const errorMessage = (error as Error).message
      
      console.log(`❌ [MySQL] Erro na tentativa ${attempt}: ${errorCode} - ${errorMessage}`)
      
      // Erros que justificam retry
      const retryableErrors = [
        'ER_CON_COUNT_ERROR',  // Too many connections
        'ECONNRESET',          // Connection reset
        'ETIMEDOUT',           // Connection timeout
        'ENOTFOUND',           // Host not found
        'ECONNREFUSED',        // Connection refused
        'PROTOCOL_CONNECTION_LOST', // Connection lost
        'ECONNABORTED',        // Connection aborted
        'ENETUNREACH',         // Network unreachable
        'EHOSTUNREACH',        // Host unreachable
        'EPIPE'                // Broken pipe
      ]
      
      const timeoutIndicators = [
        'ETIMEDOUT',
        'timeout',
        'connect ETIMEDOUT',
        'Connection timeout',
        'Query timeout'
      ]
      
      const shouldRetry = retryableErrors.includes(errorCode || '') || 
                         timeoutIndicators.some(indicator => 
                           errorMessage.toLowerCase().includes(indicator.toLowerCase())
                         )
      
      if (shouldRetry) {
        if (attempt < dbSettings.retry.maxRetries) {
          // Backoff exponencial: 1s, 2s, 4s, 8s...
          const backoffDelay = dbSettings.retry.retryDelay * Math.pow(2, attempt - 1)
          console.log(`⏳ [MySQL] Aguardando ${backoffDelay}ms antes da próxima tentativa...`)
          
          await new Promise(resolve => setTimeout(resolve, backoffDelay))
          cleanupIdleConnections(pool as unknown as { _freeConnections?: Array<{ release?: () => void }> });
          continue
        }
      }
      
      // Se chegou aqui, não faz retry (erro não recuperável ou esgotou tentativas)
      break
    }
  }
  
  if (lastError) {
    console.error(`💥 [MySQL] Esgotadas ${dbSettings.retry.maxRetries} tentativas. Último erro:`, lastError.message)
    throw lastError
  }
  throw new Error('Erro desconhecido durante a execução da query')
}
