import axios from "axios";
import { getCookie } from "./cookies";

// Instância de axios compartilhada entre cliente e servidor
export const http = axios.create({
  baseURL: "http://localhost:3000/",
});
// export const http = axios.create({
//   baseURL: "https://app-cpsi-api-production.up.railway.app/",
// });

// Interceptor de requisição para adicionar o token, dependendo do ambiente (cliente ou servidor)
http.interceptors.request.use(async (request) => {
  let token = null;

  if (typeof window === "undefined") {
    // Lado do servidor (usando cookies do Next.js)
    // O código para o servidor pode ser inserido aqui, no contexto correto
    const { cookies } = require("next/headers"); // Importação dinâmica para garantir que só seja usada no servidor
    const cookiesStore = await cookies(); // Await the cookies() function
    token = cookiesStore.get("accessToken")?.value;
  } else {
    // Lado do cliente (usando cookies do cliente com getCookie)
    token = getCookie("accessToken");
  }

  // Adiciona o token ao cabeçalho da requisição se ele existir
  if (token) {
    request.headers["Authorization"] = `Bearer ${token}`;
  }

  return request;
});
