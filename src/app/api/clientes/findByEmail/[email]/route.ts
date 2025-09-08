import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const { email } = await params;
    const emailDecoded = decodeURIComponent(email);

    const [rows] = await accessPool.execute(
      'SELECT id FROM clientes WHERE email = ? AND status = "Ativo"',
      [emailDecoded]
    );

    const exists = (rows as Array<{ id: number }>).length > 0;

    return NextResponse.json(exists);
  } catch (error) {
    console.error('Erro ao verificar email:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 