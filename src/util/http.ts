import axios from "axios";
import { getCookie } from "./cookies";

// export const http = axios.create({
//   baseURL: "http://localhost:3000/",
// });
export const http = axios.create({
  baseURL: "https://api-cpsi.aapvr.com.br/",
});

http.interceptors.request.use(async (request) => {
  let token = null;

  if (typeof window === "undefined") {
    // Lado do servidor (usando cookies do Next.js)
    // O código para o servidor pode ser inserido aqui, no contexto correto
    const { cookies } = require("next/headers"); // Importação dinâmica para garantir que só seja usada no servidor
    const cookiesStore = await cookies(); // Await the cookies() function
    token = cookiesStore.get("accessToken")?.value;
  } else {
    token = getCookie("accessToken");
  }

  if (token) {
    request.headers["Authorization"] = `Bearer ${token}`;
  }

  return request;
});
