import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPayload, isTokenExpired } from "../util/auth";
import accessConfig from "../data/access.json";

export function middleware(req: NextRequest) {
  const currentPath = req.nextUrl.pathname;
  console.log("🔍 Middleware executado para:", currentPath);

  // 🚀 Libera arquivos estáticos, login e APIs
  if (
    currentPath === "/" ||  
    currentPath.startsWith("/_next/") || 
    currentPath.startsWith("/api/") ||   
    currentPath.startsWith("/logotipo.svg") || 
    currentPath.startsWith("/favicon.ico")
  ) {
    console.log("✅ Liberado (arquivos estáticos ou página de login)");
    return NextResponse.next();
  }

  // 🔹 Obtém cookies corretamente
  const accessToken = req.cookies.get("accessToken")?.value;
  const userGroupsCookie = req.cookies.get("userGroups")?.value;

  console.log("🍪 Token recebido:", accessToken ? "Sim" : "Não");

  // 🚨 Redireciona se não houver token válido
  if (!accessToken || isTokenExpired(accessToken)) {
    console.log("🔴 Usuário sem token válido ou expirado. Redirecionando para a home.");
    if (currentPath !== "/") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  const payload = getPayload(accessToken);

  if (!payload || !payload.usuario) {
    console.log("⚠️ Erro: Payload inválido ou sem usuário.", payload);
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 📌 Verifica se existe uma regra de acesso
  const regraAcesso = accessConfig.restricoes.find((regra) =>
    currentPath.startsWith(regra.path)
  );

  if (!regraAcesso) {
    console.log("✅ Nenhuma regra específica. Liberado!");
    return NextResponse.next();
  }

  // 🔍 Verifica acesso ao sistema
  console.log("🔍 Verificando acesso ao sistema:", regraAcesso.sistema);
  console.log("📌 Sistemas do usuário:", payload.usuario.sistemas.map((s: any) => s.nome));

  const sistemaEncontrado = payload.usuario.sistemas.find(
    (sistema: any) => sistema.nome.trim().toUpperCase() === regraAcesso.sistema.trim().toUpperCase()
  );

  if (!sistemaEncontrado) {
    console.log("🔴 Usuário sem acesso ao sistema:", regraAcesso.sistema);
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 🔍 Verifica se o usuário pertence a um dos grupos permitidos
  const userGroups = userGroupsCookie ? JSON.parse(userGroupsCookie) : [];
  const userGroupNames = userGroups.map((grupo: any) => grupo.nome) || [];

  console.log("👥 Grupos do usuário:", userGroupNames);

  if (!regraAcesso.gruposPermitidos.some((group) => userGroupNames.includes(group))) {
    console.log("🔴 Usuário sem permissão para acessar:", currentPath);
    return NextResponse.redirect(new URL("/", req.url));
  }

  console.log("✅ Acesso permitido a:", currentPath);
  return NextResponse.next();
}

// **Aplica o middleware em todas as páginas do painel**
export const config = {
  matcher: "/painel/:path*",
};
