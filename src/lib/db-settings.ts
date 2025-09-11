
export const dbSettings = {
  pool: {
    connectionLimit: parseInt(process.env.MYSQL_POOL_CONNECTION_LIMIT || '3'),
    queueLimit: parseInt(process.env.MYSQL_POOL_QUEUE_LIMIT || '5'),
    waitForConnections: process.env.MYSQL_POOL_WAIT_FOR_CONNECTIONS === 'true',
  },
  timeout: {
    query: parseInt(process.env.MYSQL_QUERY_TIMEOUT || '30000'),
    connection: parseInt(process.env.MYSQL_CONNECTION_TIMEOUT || '60000'),
  },
  retry: {
    maxRetries: parseInt(process.env.MYSQL_MAX_RETRIES || '5'),      // Increased from 3 to 5
    retryDelay: parseInt(process.env.MYSQL_RETRY_DELAY || '2000'),   // Increased from 1s to 2s
  },
  logging: {
    enabled: process.env.NODE_ENV === 'development',
    slowQueryThreshold: 1000,
  }
}
export const cleanupIdleConnections = (pool: {
  _freeConnections?: Array<{
    release?: () => void;
  }>;
}) => {
  try {
    if (pool._freeConnections && pool._freeConnections.length > 0) {
      pool._freeConnections.forEach((conn) => {
        if (conn && typeof conn.release === 'function') {
          conn.release();
        }
      });
    }
  } catch (error) {
  }
} 