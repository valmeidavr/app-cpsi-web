import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { authenticateUser } from './auth-mysql'
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        login: { label: 'Login', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.password) {
          return null
        }
        const authResult = await authenticateUser(credentials.login, credentials.password)
        if (!authResult.success || !authResult.user) {
          return null
        }
        return {
          id: authResult.user.login,
          name: authResult.user.nome,
          email: authResult.user.email || authResult.user.login,
          role: authResult.user.userLevel,
          hasSystemAccess: authResult.user.hasSystemAccess,
          department: 'N/A',
          position: 'N/A'
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 dias
    updateAge: 24 * 60 * 60, // 24 horas (mais estável)
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      console.log('🔑 JWT Callback:', { trigger, userId: user?.id, hasUser: !!user, hasToken: !!token.sub })
      
      // Na primeira vez (signIn), salvar dados do usuário
      if (user && trigger === 'signIn') {
        console.log('👤 Usuário logado (primeira vez):', user.name)
        token.role = user.role
        token.hasSystemAccess = user.hasSystemAccess
        token.sub = user.id
        token.name = user.name
        token.email = user.email
      }
      
      // Manter dados existentes se token já tem informações
      if (!user && token.sub && !token.role) {
        console.log('⚠️  Token sem dados de usuário, pode ser problema de sessão')
      }
      
      return token
    },
    async session({ session, token }) {
      console.log('🎫 Session Callback:', { hasToken: !!token, tokenSub: token.sub })
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.hasSystemAccess = token.hasSystemAccess as boolean
      }
      console.log('✅ Session final:', { 
        userId: session.user?.id, 
        role: session.user?.role,
        hasAccess: session.user?.hasSystemAccess 
      })
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: false, // Desabilitado para reduzir logs
} 