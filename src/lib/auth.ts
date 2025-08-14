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
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.hasSystemAccess = user.hasSystemAccess
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.hasSystemAccess = token.hasSystemAccess as boolean
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
} 