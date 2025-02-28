import axios from "axios";
import { getCookie } from "./cookies";

export const http = axios.create({
  baseURL: "https://api-v2.aapvr.com.br/",
});

http.interceptors.request.use((request) => {
  if (!process.browser) {
    return request;
  }
  
  const token = getCookie("accessToken");

  if (token) {
    request.headers["Authorization"] = `Bearer ${token}`;
  }

  return request;
});