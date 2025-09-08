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
export const createAccessConnection = createConnection
export const createGestorConnection = createConnection
export const pool = mysql.createPool({
  ...dbConfig,
  database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'prevsaude',
  connectionLimit: 5,
  queueLimit: 10,
  waitForConnections: true,
  idleTimeout: 30000,
})
export const accessPool = pool
setInterval(() => {
  cleanupIdleConnections(pool as unknown as { _freeConnections?: Array<{ release?: () => void }> });
}, 30000);
export const testConnection = async () => {
  try {
    const connection = await createAccessConnection()
    await connection.ping()
    await connection.end()
    return true
  } catch (error) {
    console.error('Erro ao conectar com o banco de dados:', error)
    return false
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
      const [result] = await pool.execute(query, params)
      return result as T
    } catch (error) {
      lastError = error as Error
      if ((error as { code?: string }).code === 'ER_CON_COUNT_ERROR' || (error as { code?: string }).code === 'ECONNRESET') {
        if (attempt < dbSettings.retry.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, dbSettings.retry.retryDelay))
          cleanupIdleConnections(pool as unknown as { _freeConnections?: Array<{ release?: () => void }> });
          continue
        }
      }
      break
    }
  }
  if (lastError) {
    throw lastError
  }
  throw new Error('Erro desconhecido durante a execução da query')
}