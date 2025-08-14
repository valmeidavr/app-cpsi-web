import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";

export async function GET(
  request: NextRequest,
  { params }: { params: { cpf: string } }
) {
  try {
    const cpf = decodeURIComponent(params.cpf);

    const [rows] = await gestorPool.execute(
      'SELECT id FROM prestadores WHERE cpf = ? AND status = "Ativo"',
      [cpf]
    );

    const exists = (rows as any[]).length > 0;

    return NextResponse.json(exists);
  } catch (error) {
    console.error('Erro ao verificar CPF:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 