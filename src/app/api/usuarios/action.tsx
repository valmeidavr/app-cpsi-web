"use server";

import { httpServer } from "@/util/httpServer";

export async function getUsuarios() {
  const { data } = await httpServer.get("/users");
  return data;
}

type createUsuariosPayload = {
  nome: string;
  email: string;
  senha: string;
  gruposId: any;
};

export async function createUsuarios({
  nome,
  email,
  senha,
  gruposId,
}: createUsuariosPayload) {
  await httpServer.post("/users", {
    nome,
    email,
    senha,
    gruposId,
  });
}
