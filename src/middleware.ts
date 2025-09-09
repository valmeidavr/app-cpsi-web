import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname
    
    console.log('🔒 Middleware:', { pathname, hasToken: !!token, hasAccess: token?.hasSystemAccess })
    
    // Verificar se tem acesso ao sistema
    if (!token?.hasSystemAccess) {
      console.log('❌ Sem acesso ao sistema, redirecionando para /acesso-negado')
      return NextResponse.redirect(new URL('/acesso-negado', req.url))
    }
    
    // Verificar permissões específicas de rotas
    if (pathname.startsWith('/painel/') && token?.role) {
      const routePermissions = {
        '/painel/usuarios': ['Administrador'],
        '/painel/convenios': ['Administrador', 'Gestor'],
        '/painel/clientes': ['Administrador', 'Gestor'],
        '/painel/especialidades': ['Administrador', 'Gestor'],
        '/painel/procedimentos': ['Administrador', 'Gestor'],
        '/painel/unidades': ['Administrador', 'Gestor'],
        '/painel/prestadores': ['Administrador', 'Gestor'],
        '/painel/alocacoes': ['Administrador', 'Gestor'],
        '/painel/expedientes': ['Administrador', 'Gestor'],
        '/painel/turmas': ['Administrador', 'Gestor'],
        '/painel/agendas': ['Administrador', 'Gestor'],
        '/painel/lancamentos': ['Administrador', 'Gestor'],
        '/painel/plano_contas': ['Administrador', 'Gestor'],
        '/painel/caixas': ['Administrador', 'Gestor'],
        '/painel/tabela_faturamentos': ['Administrador', 'Gestor'],
        '/painel/valores_procedimentos': ['Administrador', 'Gestor'],
      }
      const currentRoute = Object.keys(routePermissions).find(route => 
        pathname.startsWith(route)
      )
      if (currentRoute) {
        const requiredRoles = routePermissions[currentRoute as keyof typeof routePermissions]
        const hasPermission = requiredRoles.includes(token.role)
        if (!hasPermission) {
          return NextResponse.redirect(new URL('/acesso-negado', req.url))
        }
      }
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        console.log('🛂 Authorized callback:', { hasToken: !!token, url: req.url })
        return !!token
      }
    }
  }
)

export const config = {
  matcher: [
    '/painel/:path*',
    '/api/protected/:path*',
  ],
}