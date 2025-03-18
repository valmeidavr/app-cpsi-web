"use server";

import { httpServer } from "@/util/httpServer";

export async function getUsuarios(
  page: number = 1,
  limit: number = 10,
  search?: string
) {
  const usuarios = await httpServer.get("/users", {
    params: { page, limit, search },
  });
  return usuarios;
}
