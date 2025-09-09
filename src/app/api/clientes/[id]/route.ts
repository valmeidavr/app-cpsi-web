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
    if (cliente.tipo !== undefined && cliente.tipo !== null) {
      if (typeof cliente.tipo === 'string' && !Object.values(TipoCliente).includes(cliente.tipo as TipoCliente)) {
      }
    }
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
    const validatedData = updateClienteSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }
    
    const { convenios, desconto = {}, ...payload } = validatedData.data;
    
    // Tratar data de nascimento
    if (payload.dtnascimento) {
      let parsedDate: Date;
      
      // Verificar se é formato brasileiro (dd/MM/yyyy)
      if (payload.dtnascimento.includes('/')) {
        const [day, month, year] = payload.dtnascimento.split('/');
        parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        // Formato ISO (yyyy-MM-dd)
        parsedDate = new Date(payload.dtnascimento + 'T00:00:00.000Z');
      }
      
      // Verificar se a data é válida
      if (isNaN(parsedDate.getTime())) {
        throw new Error(`Data de nascimento inválida: ${payload.dtnascimento}`);
      }
      
      payload.dtnascimento = parsedDate.toISOString().split('T')[0];
    }
    
    // Limpar dados
    if (payload.cpf) {
      payload.cpf = payload.cpf.replace(/\D/g, "").slice(0, 11);
    }
    if (payload.cep) {
      payload.cep = payload.cep.replace(/\D/g, "").slice(0, 8);
    }
    if (payload.telefone1) {
      payload.telefone1 = payload.telefone1.replace(/\D/g, "").slice(0, 11);
    }
    if (payload.telefone2) {
      payload.telefone2 = payload.telefone2.replace(/\D/g, "").slice(0, 11);
    }

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
    
    // Atualizar convênios
    await accessPool.execute(
      'DELETE FROM convenios_clientes WHERE cliente_id = ?',
      [id]
    );
    
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
    console.error('Erro na atualização de cliente:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.flatten() },
        { status: 400 }
      );
    }
    
    // Se for um erro de banco de dados
    if (error && typeof error === 'object' && 'code' in error) {
      const dbError = error as any;
      
      // Erro de chave duplicada (CPF/email já existe)
      if (dbError.code === 'ER_DUP_ENTRY') {
        return NextResponse.json(
          { error: "CPF ou email já cadastrado no sistema" },
          { status: 409 }
        );
      }
      
      // Erro de campo obrigatório faltando
      if (dbError.code === 'ER_NO_DEFAULT_FOR_FIELD' || dbError.code === 'ER_BAD_NULL_ERROR') {
        return NextResponse.json(
          { error: "Campos obrigatórios não informados", details: dbError.message },
          { status: 400 }
        );
      }
    }
    
    // Em desenvolvimento, mostrar mais detalhes do erro
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        { 
          error: "Erro interno do servidor", 
          details: error instanceof Error ? error.message : String(error) 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 