import axios from "axios";
import { getCookie } from "./cookies";
export const http = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/",
});
http.interceptors.request.use(async (request) => {
  let token = null;
  token = getCookie("accessToken");
  if (token) {
    request.headers["Authorization"] = `Bearer ${token}`;
  }
  return request;
});