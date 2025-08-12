import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";

// GET - Buscar convênios de um cliente
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clienteId = searchParams.get("clienteId");
    if (!clienteId) {
      return NextResponse.json({ error: "clienteId é obrigatório" }, { status: 400 });
    }

    const [rows] = await gestorPool.execute(
      `SELECT cc.id, cc.desconto, c.id as convenioId, c.nome, c.regras, c.tabela_faturamentos_id
       FROM convenios_clientes cc
       INNER JOIN convenios c ON cc.convenios_id = c.id
       WHERE cc.clientes_id = ?`,
      [clienteId]
    );

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("Erro ao buscar convênios do cliente:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
} 