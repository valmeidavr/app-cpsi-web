// Configurações otimizadas para o banco de dados MySQL
export const dbSettings = {
  // Configurações do pool de conexões
  pool: {
    connectionLimit: parseInt(process.env.MYSQL_POOL_CONNECTION_LIMIT || '3'),
    queueLimit: parseInt(process.env.MYSQL_POOL_QUEUE_LIMIT || '5'),
    waitForConnections: process.env.MYSQL_POOL_WAIT_FOR_CONNECTIONS === 'true',
  },
  
  // Configurações de timeout
  timeout: {
    query: parseInt(process.env.MYSQL_QUERY_TIMEOUT || '30000'),
    connection: parseInt(process.env.MYSQL_CONNECTION_TIMEOUT || '60000'),
  },
  
  // Configurações de retry
  retry: {
    maxRetries: parseInt(process.env.MYSQL_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.MYSQL_RETRY_DELAY || '1000'),
  },
  
  // Configurações de log
  logging: {
    enabled: process.env.NODE_ENV === 'development',
    slowQueryThreshold: 1000,
  }
}

// Função para limpar conexões ociosas
export const cleanupIdleConnections = (pool: any) => {
  try {
    // Forçar liberação de conexões ociosas
    if (pool._freeConnections && pool._freeConnections.length > 0) {
      console.log(`Limpando ${pool._freeConnections.length} conexões ociosas`);
      pool._freeConnections.forEach((conn: any) => {
        if (conn && typeof conn.release === 'function') {
          conn.release();
        }
      });
    }
  } catch (error) {
    console.error('Erro ao limpar conexões ociosas:', error);
  }
} 