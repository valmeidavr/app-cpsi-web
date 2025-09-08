import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";

// GET - Buscar prestador por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(id)
    const [rows] = await accessPool.execute(
      'SELECT * FROM prestadores WHERE id = ? AND status = "Ativo"',
      [id]
    );

    if ((rows as Array<{
      id: number;
      nome: string;
      rg: string;
      cpf: string;
      sexo: string;
      dtnascimento: string;
      cep: string;
      logradouro: string;
      numero: string;
      bairro: string;
      cidade: string;
      uf: string;
      telefone: string;
      celular: string;
      complemento: string;
      status: string;
      createdAt: Date;
      updatedAt: Date;
    }>).length === 0) {
      return NextResponse.json(
        { error: 'Prestador não encontrado' },
        { status: 404 }
      );
    }

    const prestador = (rows as Array<{
      id: number;
      nome: string;
      rg: string;
      cpf: string;
      sexo: string;
      dtnascimento: string;
      cep: string;
      logradouro: string;
      numero: string;
      bairro: string;
      cidade: string;
      uf: string;
      telefone: string;
      celular: string;
      complemento: string;
      status: string;
      createdAt: Date;
      updatedAt: Date;
    }>)[0];
    console.log('🔍 API Debug - Prestador completo:', prestador);
    console.log('🔍 API Debug - Data de nascimento:', prestador.dtnascimento);
    console.log('🔍 API Debug - Tipo da data:', typeof prestador.dtnascimento);
    return NextResponse.json(prestador);
  } catch (error) {
    console.error('Erro ao buscar prestador:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar prestador
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Atualizar prestador
    await accessPool.execute(
      `UPDATE prestadores SET 
        nome = ?, rg = ?, cpf = ?, sexo = ?, dtnascimento = ?, 
        cep = ?, logradouro = ?, numero = ?, bairro = ?, 
        cidade = ?, uf = ?, telefone = ?, celular = ?, complemento = ?
       WHERE id = ?`,
      [
        body.nome, body.rg, body.cpf, body.sexo, body.dtnascimento,
        body.cep, body.logradouro, body.numero, body.bairro,
        body.cidade, body.uf, body.telefone, body.celular, body.complemento, id
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar prestador:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 