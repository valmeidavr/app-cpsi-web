// Configurações otimizadas para o banco de dados - CORRIGIDAS para MySQL2
export const dbConfig = {
  // Configurações do pool de conexões - APENAS opções válidas do MySQL2
  pool: {
    connectionLimit: 5, // Máximo de 5 conexões simultâneas
    queueLimit: 10, // Máximo de 10 requisições na fila
    waitForConnections: true, // Aguardar por conexões disponíveis
    acquireTimeout: 60000, // 60 segundos para adquirir conexão (válido para pool)
    idleTimeout: 30000, // 30 segundos para conexões ociosas
    maxIdle: 30000, // Tempo máximo que uma conexão pode ficar ociosa
  },
  
  // Configurações de retry
  retry: {
    maxRetries: 3, // Máximo de 3 tentativas
    retryDelay: 1000, // 1 segundo entre tentativas
  },
  
  // Configurações de timeout
  timeout: {
    query: 30000, // 30 segundos para queries
    connection: 60000, // 60 segundos para conexões
  },
  
  // Configurações de log
  logging: {
    enabled: process.env.NODE_ENV === 'development',
    slowQueryThreshold: 1000, // Log queries que demoram mais de 1 segundo
  }
}

// Função para verificar a saúde do pool de conexões
export const checkPoolHealth = (pool: any) => {
  return {
    totalConnections: pool._allConnections?.length || 0,
    idleConnections: pool._freeConnections?.length || 0,
    activeConnections: (pool._allConnections?.length || 0) - (pool._freeConnections?.length || 0),
    waitingRequests: pool._connectionQueue?.length || 0,
  }
} 