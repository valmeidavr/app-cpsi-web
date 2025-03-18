import * as cookie from "cookie";
import Cookies from "js-cookie";

export function parseCookies(req?: any) {
  if (!req || !req.headers) {
    return {};
  }
  return cookie.parse(req.headers.cookie || "");
}

export function setCookie(
  key: string,
  value: string | object,
  options?: Cookies.CookieAttributes
) {
  const stringValue = typeof value === "object" ? JSON.stringify(value) : value;
  Cookies.set(key, stringValue, {
    ...options,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax", // ⚠️ Alterado para evitar problemas no Next.js
    path: "/", // ✅ Garante acesso globalmente
    expires: 1, // Expira em 1 dia
  });
}

export function getCookie(key: string) {
  return Cookies.get(key);
}

export function delCookie(): any {
  Cookies.remove("accessToken", { path: "/" });
  Cookies.remove("userGroups", { path: "/" });
}
