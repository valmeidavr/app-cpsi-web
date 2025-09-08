import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [rows] = await accessPool.execute(
      'SELECT id, nome, desconto, regras, tabela_faturamento_id FROM convenios WHERE id = ?',
      [id]
    );
    if ((rows as Array<{
      id: number;
      nome: string;
      desconto: number;
      regras: string;
      tabela_faturamento_id: number;
    }>).length === 0) {
      return NextResponse.json(
        { error: 'Convênio não encontrado' },
        { status: 404 }
      );
    }
    const convenio = (rows as Array<{
      id: number;
      nome: string;
      desconto: number;
      regras: string;
      tabela_faturamento_id: number;
    }>)[0];
    return NextResponse.json(convenio);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    if (!body.nome || !body.regras || body.tabela_faturamento_id === undefined) {
      return NextResponse.json(
        { error: 'Campos obrigatórios não preenchidos' },
        { status: 400 }
      );
    }
    const desconto = body.desconto !== undefined ? Number(body.desconto) : 0;
    await accessPool.execute(
      `UPDATE convenios SET 
        nome = ?, desconto = ?, regras = ?, tabela_faturamento_id = ?
       WHERE id = ?`,
      [body.nome, desconto, body.regras, body.tabela_faturamento_id, id]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 