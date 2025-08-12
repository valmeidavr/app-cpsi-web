import mysql from 'mysql2/promise'

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

// Pool de conexões para melhor performance
export const accessPool = mysql.createPool({
  ...dbConfigACesso,
  database: process.env.MYSQL_ACCESS_DB || 'cpsi_acesso',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

export const gestorPool = mysql.createPool({
  ...dbConfigGestor,
  database: process.env.MYSQL_GESTOR_DB || 'gestor',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

