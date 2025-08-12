import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    role?: string
    hasSystemAccess?: boolean
    department?: string
    position?: string
  }

  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
      hasSystemAccess?: boolean
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string
    hasSystemAccess?: boolean
  }
} 