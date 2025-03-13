import axios from "axios";
import { getCookie } from "./cookies";

export const http = axios.create({
  baseURL: "https://app-cpsi-api-production.up.railway.app/",
});

http.interceptors.request.use((request) => {
  if (!process.browser) {
    return request;
  }

  const token = getCookie("accessToken");
  console.log('token', token);
  if (token) {
    request.headers["Authorization"] = `Bearer ${token}`;
  }

  return request;
});
