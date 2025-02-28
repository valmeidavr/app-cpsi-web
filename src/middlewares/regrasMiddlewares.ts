import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPayload, isTokenExpired } from "../util/auth";
import accessConfig from "../data/access.json";

export function middleware(req: NextRequest) {
  const currentPath = req.nextUrl.pathname;

  // 🚀 Libera arquivos estáticos, login e APIs
  if (
    currentPath === "/" ||  
    currentPath.startsWith("/_next/") || 
    currentPath.startsWith("/api/") ||   
    currentPath.startsWith("/logotipo.svg") || 
    currentPath.startsWith("/favicon.ico")
  ) {

    return NextResponse.next();
  }

  // 🔹 Obtém cookies corretamente
  const accessToken = req.cookies.get("accessToken")?.value;
  const userGroupsCookie = req.cookies.get("userGroups")?.value;

  // 🚨 Redireciona se não houver token válido
  if (!accessToken || isTokenExpired(accessToken)) {
    if (currentPath !== "/") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  const payload = getPayload(accessToken);

  if (!payload || !payload.usuario) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 📌 Verifica se existe uma regra de acesso
  const regraAcesso = accessConfig.restricoes.find((regra) =>
    currentPath.startsWith(regra.path)
  );

  if (!regraAcesso) {
    return NextResponse.next();
  }

  const sistemaEncontrado = payload.usuario.sistemas.find(
    (sistema: any) => sistema.nome.trim().toUpperCase() === regraAcesso.sistema.trim().toUpperCase()
  );

  if (!sistemaEncontrado) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 🔍 Verifica se o usuário pertence a um dos grupos permitidos
  const userGroups = userGroupsCookie ? JSON.parse(userGroupsCookie) : [];
  const userGroupNames = userGroups.map((grupo: any) => grupo.nome) || [];

  if (!regraAcesso.gruposPermitidos.some((group) => userGroupNames.includes(group))) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

// **Aplica o middleware em todas as páginas do painel**
export const config = {
  matcher: "/painel/:path*",
};
