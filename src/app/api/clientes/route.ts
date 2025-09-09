import { NextRequest, NextResponse } from "next/server";
import { accessPool, executeWithRetry } from "@/lib/mysql";
import { z } from "zod";
import {
  createClienteSchema,
  updateClienteSchema,
} from "./shema/formSchemaCliente";
import { getDateOnlyUTCISO } from "@/app/helpers/dateUtils";
import { limparCEP, limparCPF, limparTelefone } from "@/util/clearData";
export type CreateClienteDTO = z.infer<typeof createClienteSchema>;
export type UpdateClienteDTO = z.infer<typeof updateClienteSchema>;
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';
    let whereClause = '';
    const queryParams: (string | number)[] = [];
    if (search) {
      whereClause = ' WHERE (nome LIKE ? OR email LIKE ? OR cpf LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    } else {
      whereClause = ' WHERE status = "Ativo"';
    }
    const countQuery = `SELECT COUNT(*) as total FROM clientes${whereClause}`;
    const countRows = await executeWithRetry(accessPool, countQuery, queryParams);
    const total = (countRows as Array<{ total: number }>)[0]?.total || 0;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const dataQuery = `
      SELECT DISTINCT id, nome, email, cpf, dtnascimento, cep, logradouro, bairro, cidade, 
                     uf, telefone1, telefone2, status, tipo, created_at, updated_at
      FROM clientes${whereClause}
      ORDER BY nome ASC, id ASC
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `;
    const dataParams = [...queryParams];
    const clienteRows = await executeWithRetry(accessPool, dataQuery, dataParams);
    return NextResponse.json({
      data: (clienteRows as Array<{
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
        created_at: Date;
        updated_at: Date;
      }>),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createClienteSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }
    const { convenios, desconto = {}, ...payload } = validatedData.data;
    if (payload.dtnascimento) {
      // Para datas de nascimento, preservar a data exata sem ajuste de timezone
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
    payload.cpf = limparCPF(String(payload.cpf));
    if (payload.cep) {
      payload.cep = limparCEP(String(payload.cep));
    }
    payload.telefone1 = limparTelefone(String(payload.telefone1));
    if (payload.telefone2) {
      payload.telefone2 = limparTelefone(String(payload.telefone2));
    }
    const [result] = await accessPool.execute(
      `INSERT INTO clientes (
        nome, email, cpf, dtnascimento, cep, logradouro, bairro, cidade, 
        uf, telefone1, telefone2, status, sexo, tipo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.nome,
        payload.email,
        payload.cpf,
        payload.dtnascimento,
        payload.cep,
        payload.logradouro,
        payload.bairro,
        payload.cidade,
        payload.uf,
        payload.telefone1,
        payload.telefone2,
        "Ativo",
        payload.sexo,
        payload.tipo,
      ]
    );
    const clienteId = (result as { insertId: number }).insertId;
    if (convenios && convenios.length > 0) {
      for (const convenioId of convenios) {
        const descontoValue = desconto[convenioId];
        const descontoFinal =
          typeof descontoValue === "number" && !isNaN(descontoValue)
            ? descontoValue
            : 0;
        await accessPool.execute(
          "INSERT INTO convenios_clientes (convenio_id, cliente_id, desconto) VALUES (?, ?, ?)",
          [convenioId, clienteId, descontoFinal]
        );
      }
    }
    return NextResponse.json({
      success: true,
      id: clienteId,
    });
  } catch (error) {
    console.error('Erro no cadastro de cliente:', error);
    
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
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "ID do cliente é obrigatório" },
        { status: 400 }
      );
    }
    const body = await request.json();
    const validatedData = updateClienteSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }
    const { convenios, desconto = {}, ...payload } = validatedData.data;
    if (payload.dtnascimento) {
      // Para datas de nascimento, preservar a data exata sem ajuste de timezone
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
    payload.cpf = limparCPF(String(payload.cpf));
    if (payload.cep) {
      payload.cep = limparCEP(String(payload.cep));
    }
    payload.telefone1 = limparTelefone(String(payload.telefone1));
    if (payload.telefone2) {
      payload.telefone2 = limparTelefone(String(payload.telefone2));
    }
    await accessPool.execute(
      `UPDATE clientes SET 
        nome = ?, email = ?, cpf = ?, dtnascimento = ?, cep = ?,
        logradouro = ?, bairro = ?, cidade = ?, uf = ?, telefone1 = ?, telefone2 = ?
       WHERE id = ?`,
      [
        payload.nome,
        payload.email,
        payload.cpf,
        payload.dtnascimento,
        payload.cep,
        payload.logradouro,
        payload.bairro,
        payload.cidade,
        payload.uf,
        payload.telefone1,
        payload.telefone2,
        id,
      ]
    );
    if (convenios && convenios.length > 0) {
      await accessPool.execute(
        "DELETE FROM convenios_clientes WHERE cliente_id = ?",
        [id]
      );
      for (const convenioId of convenios) {
        const descontoValue = desconto[convenioId];
        const descontoFinal =
          typeof descontoValue === "number" && !isNaN(descontoValue)
            ? descontoValue
            : 0;
        await accessPool.execute(
          "INSERT INTO convenios_clientes (convenio_id, cliente_id, desconto) VALUES (?, ?, ?)",
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
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "ID do cliente é obrigatório" },
        { status: 400 }
      );
    }
    await accessPool.execute(
      'UPDATE clientes SET status = "Inativo" WHERE id = ?',
      [id]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}