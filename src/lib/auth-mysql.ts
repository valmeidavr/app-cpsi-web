import { gestorPool } from './mysql'
import bcrypt from 'bcrypt'

export interface AuthUser {
  login: string
  senha: string
  nome: string
  email: string | null
  isAdmin: boolean
  hasSystemAccess: boolean
  userLevel: string
}

export interface AuthResult {
  success: boolean
  user?: AuthUser
  error?: string
}

export async function authenticateUser(login: string, password: string): Promise<AuthResult> {
  try {
    console.log('🔍 Iniciando autenticação para:', login)
    
    // Buscar usuário na tabela usuarios do database acesso
    const [userRows] = await gestorPool.execute(
      'SELECT login, senha, nome, email FROM usuarios WHERE login = ? AND status = ? LIMIT 1',
      [login, 'Ativo']
    )

    const users = userRows as {login: string, senha: string, nome: string, email: string | null}[]
    
    if (users.length === 0) {
      console.log('❌ Usuário não encontrado ou inativo:', login)
      return {
        success: false,
        error: 'Usuário não encontrado ou inativo'
      }
    }

    const user = users[0]
    console.log('✅ Usuário encontrado:', user.login)
    console.log('🔑 Hash do banco:', user.senha)
    
    // Verificar senha usando bcrypt (compatível com Laravel PHP Hash::make)
    // Laravel usa $2y$ enquanto bcrypt padrão usa $2a$, mas são compatíveis
    let isPasswordValid = false
    
    try {
      // Se o hash começa com $2y$, converter para $2a$ para compatibilidade
      let hashToCompare = user.senha
      if (hashToCompare.startsWith('$2y$')) {
        hashToCompare = hashToCompare.replace('$2y$', '$2a$')
        console.log('🔄 Hash convertido:', hashToCompare)
      }
      
      console.log('🔐 Verificando senha...')
      isPasswordValid = await bcrypt.compare(password, hashToCompare)
      console.log('✅ Resultado da verificação:', isPasswordValid)
    } catch (error) {
      console.error('❌ Erro ao verificar senha:', error)
      return {
        success: false,
        error: 'Erro na verificação da senha'
      }
    }
    
    if (!isPasswordValid) {
      console.log('❌ Senha incorreta para:', login)
      return {
        success: false,
        error: 'Senha incorreta'
      }
    }

    // Verificar se o usuário tem acesso ao sistema CPSI
    const [sistemaRows] = await gestorPool.execute(
      'SELECT s.id, s.nome, us.nivel FROM sistemas s INNER JOIN usuario_sistema us ON s.id = us.sistemas_id WHERE s.id = ? AND us.usuarios_login = ?',
      [1087, login]
    )

    console.log("Usuario existe no sistema",sistemaRows)
    const sistemaResult = sistemaRows as {id: number, nome: string, nivel: string}[]
    const hasSystemAccess = sistemaResult.length > 0
    const userLevel = sistemaResult[0]?.nivel || 'Usuario'
    const isAdmin = userLevel === 'Administrador'

    return {
      success: true,
      user: {
        login: user.login,
        senha: user.senha,
        nome: user.nome,
        email: user.email || null,
        isAdmin,
        hasSystemAccess,
        userLevel
      }
    }

  } catch (error) {
    console.error('Erro na autenticação:', error)
    return {
      success: false,
      error: 'Erro interno do servidor'
    }
  }
}

export async function checkUserAdmin(userLogin: string): Promise<boolean> {
  try {
    const [adminRows] = await gestorPool.execute(
      'SELECT COUNT(*) as count FROM usuario_sistema WHERE sistemas_id = ? AND usuarios_login = ?',
      [1088, userLogin]
    )

    const adminResult = adminRows as {count: number}[]
    return adminResult[0]?.count > 0
  } catch (error) {
    console.error('Erro ao verificar admin:', error)
    return false
  }
}

export async function checkUserSystemAdmin(userLogin: string): Promise<boolean> {
  try {
    const [adminRows] = await gestorPool.execute(
      'SELECT COUNT(*) as count FROM usuario_sistema WHERE sistemas_id = ? AND usuarios_login = ? AND nivel = ?',
      [1088, userLogin, 'Administrador']
    )

    const adminResult = adminRows as {count: number}[]
    return adminResult[0]?.count > 0
  } catch (error) {
    console.error('Erro ao verificar admin sistema:', error)
    return false
  }
} 