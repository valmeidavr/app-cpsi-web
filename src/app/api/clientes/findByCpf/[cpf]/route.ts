import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";

export async function GET(
  request: NextRequest,
  { params }: { params: { cpf: string } }
) {
  try {
    const cpf = decodeURIComponent(params.cpf);

    const [rows] = await gestorPool.execute(
      'SELECT id FROM clientes WHERE cpf = ? AND status = "Ativo"',
      [cpf]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Erro ao buscar cliente por CPF:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
