import axios from "axios";
import { getCookie } from "./cookies";
export const http = axios.create({
  baseURL: "http://localhost:3000/",
});
http.interceptors.request.use(async (request) => {
  let token = null;
  token = getCookie("accessToken");
  if (token) {
    request.headers["Authorization"] = `Bearer ${token}`;
  }
  return request;
});