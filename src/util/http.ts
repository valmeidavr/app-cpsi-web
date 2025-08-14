import axios from "axios";
import { getCookie } from "./cookies";

export const http = axios.create({
  baseURL: "http://localhost:3000/",
});
// export const http = axios.create({
//   baseURL: "https://api-cpsi.aapvr.com.br/",
// });

http.interceptors.request.use(async (request) => {
  let token = null;

  // Usar apenas getCookie que funciona tanto no cliente quanto no servidor
  token = getCookie("accessToken");

  if (token) {
    request.headers["Authorization"] = `Bearer ${token}`;
  }

  return request;
});
