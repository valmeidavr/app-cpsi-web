import { accessPool, testConnection, listTables } from './mysql'
import bcrypt from "bcryptjs";

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
    const isConnected = await testConnection()
    if (!isConnected) {
      return {
        success: false,
        error: 'Erro de conexão com o banco de dados. Verifique se o MySQL está rodando.'
      }
    }
    const [userRows] = await accessPool.execute(
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
    let isPasswordValid = false
    try {
      let hashToCompare = user.senha
      if (hashToCompare.startsWith('$2y$')) {
        hashToCompare = hashToCompare.replace('$2y$', '$2a$')
      }
      isPasswordValid = await bcrypt.compare(password, hashToCompare)
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
    let hasSystemAccess = false
    let userLevel = 'Usuario'
    let isAdmin = false
    const isAdminUser = login.toLowerCase() === 'admin' || 
                       user.nome.toLowerCase().includes('administrador') ||
                       user.nome.toLowerCase().includes('admin') ||
                       user.nome === 'Administrador do Sistema'
    try {
      const [tableCheck] = await accessPool.execute(
        "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'usuariogrupo'",
        [process.env.MYSQL_DATABASE || 'prevsaude']
      )
      const groupTableExists = (tableCheck as {count: number}[])[0]?.count > 0
      if (groupTableExists) {
        const [groupRows] = await accessPool.execute(
          'SELECT grupo_id FROM usuariogrupo WHERE usuario_login = ?',
          [login]
        )
        console.log("Grupos do usuário:", groupRows)
        const userGroups = (groupRows as {grupo_id: number}[]).map(g => g.grupo_id)
        const adminGroups = [1, 2, 3, 4]
        const hasAdminGroup = userGroups.some(groupId => adminGroups.includes(groupId))
        if (hasAdminGroup) {
          console.log('🔑 Usuário tem grupos de administrador')
          hasSystemAccess = true
          userLevel = 'Administrador'
          isAdmin = true
        } else {
          console.log('⚠️ Usuário não tem grupos de administrador')
          hasSystemAccess = true
          userLevel = 'Usuario'
          isAdmin = false
        }
      } else {
        console.log('⚠️ Tabela usuariogrupo não encontrada, usando verificação por nome')
        hasSystemAccess = true
        userLevel = 'Usuario'
        isAdmin = false
        if (isAdminUser) {
          userLevel = 'Administrador'
          isAdmin = true
        }
        if (user.nome === 'Administrador do Sistema') {
          userLevel = 'Administrador'
          isAdmin = true
        }
      }
    } catch (error) {
      hasSystemAccess = true
      userLevel = 'Usuario'
      isAdmin = false
      if (isAdminUser) {
        userLevel = 'Administrador'
        isAdmin = true
      }
      if (user.nome === 'Administrador do Sistema') {
        userLevel = 'Administrador'
        isAdmin = true
      }
    }
    const authResult = {
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
    if (authResult.user.nome === 'Administrador do Sistema' && authResult.user.userLevel !== 'Administrador') {
      authResult.user.userLevel = 'Administrador'
      authResult.user.isAdmin = true
    }
    return authResult
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
    const [tableCheck] = await accessPool.execute(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'usuario_sistema'",
      [process.env.MYSQL_DATABASE || 'prevsaude']
    )
    const tableExists = (tableCheck as {count: number}[])[0]?.count > 0
    if (!tableExists) {
      console.log('⚠️ Tabela usuario_sistema não encontrada, retornando false para admin')
      return false
    }
    const [adminRows] = await accessPool.execute(
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
    const [tableCheck] = await accessPool.execute(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ? AND table_name = 'usuario_sistema'",
      [process.env.MYSQL_DATABASE || 'prevsaude']
    )
    const tableExists = (tableCheck as {count: number}[])[0]?.count > 0
    if (!tableExists) {
      console.log('⚠️ Tabela usuario_sistema não encontrada, retornando false para admin sistema')
      return false
    }
    const [adminRows] = await accessPool.execute(
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