export function isTokenExpired(token: string) {
  const payload = getPayload(token);
  if (!payload || !payload.exp) return true; // Evita erro se o payload for inválido
  const clockTimestamp = Math.floor(Date.now() / 1000);
  return clockTimestamp > payload.exp;
}

  
export function getPayload(token: string) {
  try {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString("utf8"));
  } catch (error) {
    console.error("⚠️ Erro ao decodificar token:", error);
    return null; // Retorna null se houver erro
  }
}
