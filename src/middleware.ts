import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Mapeamento de roles do menu.json para níveis do banco
const ROLE_MAPPING = {
  'ADMIN': 'Administrador',
  'GESTOR': 'Gestor', 
  'USUARIO': 'Usuario'
}

// Função para verificar se o usuário tem permissão para a rota
function hasRoutePermission(userLevel: string, requiredGroups: string[]): boolean {
  // Administrador tem acesso a tudo
  if (userLevel === 'Administrador') return true
  
  // Gestor tem acesso a rotas que requerem ADMIN ou GESTOR
  if (userLevel === 'Gestor') {
    return requiredGroups.some(group => group === 'ADMIN' || group === 'GESTOR')
  }
  
  // Usuario tem acesso apenas a rotas que requerem USUARIO
  if (userLevel === 'Usuario') {
    return requiredGroups.some(group => group === 'USUARIO')
  }
  
  return false
}

export function middleware(request: NextRequest) {
  // Adicionar headers para controle de cache e conexões
  const response = NextResponse.next()
  
  // Headers para evitar cache desnecessário
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  
  // Header para controle de conexões
  response.headers.set('Connection', 'keep-alive')
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname
    
    // Debug: log do token
    console.log('Middleware - Token:', token)
    console.log('Middleware - Pathname:', pathname)
    
    // Se não tem acesso ao sistema, redirecionar para página de acesso negado
    if (token && !token.hasSystemAccess) {
      console.log('Middleware - Usuário sem acesso ao sistema, redirecionando...')
      return NextResponse.redirect(new URL('/acesso-negado', req.url))
    }
    
    // Verificar permissões específicas para rotas do painel
    if (pathname.startsWith('/painel/') && token?.userLevel) {
      // Importar menu.json dinamicamente (simulado aqui)
      const menuRoutes = [
        { path: '/painel/convenios', requiredGroups: ['ADMIN', 'GESTOR'] },
        { path: '/painel/clientes', requiredGroups: ['ADMIN', 'GESTOR'] },
        { path: '/painel/especialidades', requiredGroups: ['ADMIN', 'GESTOR'] },
        { path: '/painel/procedimentos', requiredGroups: ['ADMIN', 'GESTOR'] },
        { path: '/painel/unidades', requiredGroups: ['ADMIN', 'GESTOR'] },
        { path: '/painel/prestadores', requiredGroups: ['ADMIN', 'GESTOR'] },
        { path: '/painel/alocacoes', requiredGroups: ['ADMIN', 'GESTOR'] },
        { path: '/painel/expedientes', requiredGroups: ['ADMIN', 'GESTOR'] },
        { path: '/painel/turmas', requiredGroups: ['ADMIN', 'GESTOR'] },
        { path: '/painel/agendas', requiredGroups: ['ADMIN', 'GESTOR'] },
        { path: '/painel/lancamentos', requiredGroups: ['ADMIN', 'GESTOR'] },
        { path: '/painel/plano_contas', requiredGroups: ['ADMIN', 'GESTOR'] },
        { path: '/painel/caixas', requiredGroups: ['ADMIN', 'GESTOR'] },
        { path: '/painel/tabela_faturamentos', requiredGroups: ['ADMIN', 'GESTOR'] },
        { path: '/painel/valores_procedimentos', requiredGroups: ['ADMIN', 'GESTOR'] },
        { path: '/painel/usuarios', requiredGroups: ['ADMIN', 'GESTOR'] },
      ]
      
      // Verificar se a rota atual requer permissões específicas
      const currentRoute = menuRoutes.find(route => pathname.startsWith(route.path))
      
      if (currentRoute) {
        const hasPermission = hasRoutePermission(token.userLevel, currentRoute.requiredGroups)
        
        if (!hasPermission) {
          console.log(`Middleware - Usuário sem permissão para ${pathname}. Nível: ${token.userLevel}, Requerido: ${currentRoute.requiredGroups}`)
          return NextResponse.redirect(new URL('/acesso-negado', req.url))
        }
      }
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        console.log('Middleware - Verificando autorização:', !!token, token?.hasSystemAccess)
        // Verificar se está autenticado E tem acesso ao sistema
        return !!token && !!token.hasSystemAccess
      },
    },
  }
)
