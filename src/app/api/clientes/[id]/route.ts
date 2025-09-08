import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";
import { TipoCliente } from "@/app/types/Cliente";
import { updateClienteSchema } from "../shema/formSchemaCliente";
import { z } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [rows] = await accessPool.execute(
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
    const [conveniosRows] = await accessPool.execute(
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
    const validatedData = updateClienteSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    const { convenios, desconto = {}, ...payload } = validatedData.data;

    // Atualizar cliente
    await accessPool.execute(
      `UPDATE clientes SET 
        nome = ?, email = ?, dtnascimento = ?, sexo = ?, tipo = ?, 
        cpf = ?, cep = ?, logradouro = ?, numero = ?, bairro = ?, 
        cidade = ?, uf = ?, telefone1 = ?, telefone2 = ?
       WHERE id = ?`,
      [
        payload.nome, payload.email, payload.dtnascimento, payload.sexo, payload.tipo,
        payload.cpf, payload.cep, payload.logradouro, payload.numero, payload.bairro,
        payload.cidade, payload.uf, payload.telefone1, payload.telefone2, id
      ]
    );

    // Remover convênios antigos
    await accessPool.execute(
      'DELETE FROM convenios_clientes WHERE cliente_id = ?',
      [id]
    );

    // Adicionar novos convênios
    if (convenios && convenios.length > 0) {
      for (const convenioId of convenios) {
        const descontoValue = desconto[convenioId];
        const descontoFinal = typeof descontoValue === 'number' && !isNaN(descontoValue) 
          ? descontoValue 
          : 0;

        await accessPool.execute(
          'INSERT INTO convenios_clientes (convenio_id, cliente_id, desconto) VALUES (?, ?, ?)',
          [convenioId, id, descontoFinal]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 