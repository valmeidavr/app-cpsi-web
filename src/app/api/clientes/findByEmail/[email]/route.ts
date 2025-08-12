import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";

export async function GET(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    const email = decodeURIComponent(params.email);

    const [rows] = await gestorPool.execute(
      'SELECT id FROM clientes WHERE email = ? AND status = "Ativo"',
      [email]
    );

    const exists = (rows as any[]).length > 0;

    return NextResponse.json(exists);
  } catch (error) {
    console.error('Erro ao verificar email:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 