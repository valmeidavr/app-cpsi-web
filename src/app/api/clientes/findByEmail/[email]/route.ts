import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const { email } = await params;
    const emailDecoded = decodeURIComponent(email);
    console.log('🔍 [EMAIL API] Verificando email:', emailDecoded);
    
    const [rows] = await accessPool.execute(
      'SELECT id FROM clientes WHERE email = ? AND status = "Ativo"',
      [emailDecoded]
    );
    
    const exists = (rows as Array<{ id: number }>).length > 0;
    console.log('📊 [EMAIL API] Email já existe:', exists);
    
    return NextResponse.json({ exists });
  } catch (error) {
    console.error('❌ [EMAIL API] Erro ao verificar email:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
} 