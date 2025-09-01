import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";
import { TipoCliente } from "@/app/types/Cliente";

// GET - Buscar cliente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [rows] = await gestorPool.execute(
      'SELECT * FROM clientes WHERE id = ? AND status = "Ativo"',
      [id]
    );

    if ((rows as Array<{
      id: number;
      nome: string;
      email: string;
      cpf: string;
      dtnascimento: string;
      cep: string;
      logradouro: string;
      bairro: string;
      cidade: string;
      uf: string;
      telefone1: string;
      telefone2: string;
      status: string;
      tipo: string;
      sexo: string;
      createdAt: Date;
      updatedAt: Date;
    }>).length === 0) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    const cliente = (rows as Array<{
      id: number;
      nome: string;
      email: string;
      cpf: string;
      dtnascimento: string;
      cep: string;
      logradouro: string;
      bairro: string;
      cidade: string;
      uf: string;
      telefone1: string;
      telefone2: string;
      status: string;
      tipo: string;
      sexo: string;
      createdAt: Date;
      updatedAt: Date;
    }>)[0];
    
    // Log para debug
    console.log('🔍 Cliente encontrado:', {
      id: cliente.id,
      nome: cliente.nome,
      sexo: cliente.sexo,
      tipo: cliente.tipo,
      dtnascimento: cliente.dtnascimento
    });

    // Garantir que o campo tipo seja mapeado corretamente
    // Se tipo for um número, converter para o valor do enum
    if (cliente.tipo !== undefined && cliente.tipo !== null) {
      // Se tipo for número, manter como está (será tratado no frontend)
      // Se tipo for string, verificar se é válido
      if (typeof cliente.tipo === 'string' && !Object.values(TipoCliente).includes(cliente.tipo as TipoCliente)) {
        console.warn('⚠️ Tipo inválido encontrado:', cliente.tipo);
      }
    }

    // Buscar convênios do cliente
    const [conveniosRows] = await gestorPool.execute(
      'SELECT convenio_id, desconto FROM convenios_clientes WHERE cliente_id = ?',
      [id]
    );
    
    const convenios = (conveniosRows as Array<{
      convenio_id: number;
      desconto: number;
    }>).map((row) => ({
      convenioId: row.convenio_id,
      desconto: row.desconto
    }));

    return NextResponse.json({
      ...cliente,
      convenios
    });
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar cliente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Atualizar cliente
    await gestorPool.execute(
      `UPDATE clientes SET 
        nome = ?, email = ?, dtnascimento = ?, sexo = ?, tipo = ?, 
        cpf = ?, cep = ?, logradouro = ?, numero = ?, bairro = ?, 
        cidade = ?, uf = ?, telefone1 = ?, telefone2 = ?
       WHERE id = ?`,
      [
        body.nome, body.email, body.dtnascimento, body.sexo, body.tipo,
        body.cpf, body.cep, body.logradouro, body.numero, body.bairro,
        body.cidade, body.uf, body.telefone1, body.telefone2, id
      ]
    );

    // Remover convênios antigos
    await gestorPool.execute(
      'DELETE FROM convenios_clientes WHERE cliente_id = ?',
      [id]
    );

    // Adicionar novos convênios
    if (body.convenios && body.convenios.length > 0) {
      for (const convenioId of body.convenios) {
        const descontoValue = body.desconto[convenioId];
        const descontoFinal = typeof descontoValue === 'number' && !isNaN(descontoValue) 
          ? descontoValue 
          : 0;

        await gestorPool.execute(
          'INSERT INTO convenios_clientes (convenio_id, cliente_id, desconto) VALUES (?, ?, ?)',
          [convenioId, id, descontoFinal]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 