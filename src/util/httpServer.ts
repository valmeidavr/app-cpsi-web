import axios from "axios";
import { cookies } from "next/headers";

export const httpServer = axios.create({
  baseURL: "https://app-cpsi-api-production.up.railway.app/",
});

httpServer.interceptors.request.use(async (request) => {

  const cookiesStore = await cookies();
  const token = cookiesStore.get("accessToken")?.value;

  if (token) {
    request.headers["Authorization"] = `Bearer ${token}`;
  }

  return request;
});
