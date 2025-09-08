import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cpf: string }> }
) {
  try {
    const { cpf } = await params;
    const cpfDecoded = decodeURIComponent(cpf);

    const [rows] = await accessPool.execute(
      'SELECT id FROM clientes WHERE cpf = ? AND status = "Ativo"',
      [cpfDecoded]
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
