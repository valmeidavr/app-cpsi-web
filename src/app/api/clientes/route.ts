import { NextRequest, NextResponse } from "next/server";
import { gestorPool, executeWithRetry } from "@/lib/mysql";
import { z } from "zod";
import {
  createClienteSchema,
  updateClienteSchema,
} from "./shema/formSchemaCliente";
import { getDateOnlyUTCISO } from "@/app/helpers/dateUtils";
import { limparCEP, limparCPF, limparTelefone } from "@/util/clearData";

export type CreateClienteDTO = z.infer<typeof createClienteSchema>;
export type UpdateClienteDTO = z.infer<typeof updateClienteSchema>;

// GET - Listar clientes com paginação e busca
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';

    // 1. Construir a cláusula WHERE dinamicamente
    let whereClause = '';
    const queryParams: (string | number)[] = [];

    if (search) {
      whereClause = ' WHERE (nome LIKE ? OR email LIKE ? OR cpf LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    } else {
      // Se não há busca, retornar apenas clientes ativos
      whereClause = ' WHERE status = "Ativo"';
    }

    // 2. Query para contar o total de registros (usando a cláusula WHERE)
    const countQuery = `SELECT COUNT(*) as total FROM clientes${whereClause}`;
    
    const countRows = await executeWithRetry(gestorPool, countQuery, queryParams);
    const total = (countRows as Array<{ total: number }>)[0]?.total || 0;

    // 3. Query para buscar os dados com paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const dataQuery = `
      SELECT DISTINCT id, nome, email, cpf, dtnascimento, cep, logradouro, bairro, cidade, 
                     uf, telefone1, telefone2, status, tipo, createdAt, updatedAt
      FROM clientes${whereClause}
      ORDER BY nome ASC, id ASC
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `;
    const dataParams = [...queryParams];
    
    const clienteRows = await executeWithRetry(gestorPool, dataQuery, dataParams);

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
        createdAt: Date;
        updatedAt: Date;
      }>),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar cliente
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

    // Formatar dados
    if (payload.dtnascimento) {
      const parsedDate = new Date(payload.dtnascimento);
      payload.dtnascimento = getDateOnlyUTCISO(parsedDate);
    }
    payload.cpf = limparCPF(String(payload.cpf));
    if (payload.cep) {
      payload.cep = limparCEP(String(payload.cep));
    }
    payload.telefone1 = limparTelefone(String(payload.telefone1));
    if (payload.telefone2) {
      payload.telefone2 = limparTelefone(String(payload.telefone2));
    }

    // Inserir cliente
    const [result] = await gestorPool.execute(
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

    // Salvar convênios do cliente com seus respectivos descontos
    if (convenios && convenios.length > 0) {
      for (const convenioId of convenios) {
        const descontoValue = desconto[convenioId];
        const descontoFinal =
          typeof descontoValue === "number" && !isNaN(descontoValue)
            ? descontoValue
            : 0;

        await gestorPool.execute(
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
    console.error("Erro ao criar cliente:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PUT - Atualizar cliente
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

    // Formatar dados
    if (payload.dtnascimento) {
      const parsedDate = new Date(payload.dtnascimento);
      payload.dtnascimento = getDateOnlyUTCISO(parsedDate);
    }
    payload.cpf = limparCPF(String(payload.cpf));
    if (payload.cep) {
      payload.cep = limparCEP(String(payload.cep));
    }
    payload.telefone1 = limparTelefone(String(payload.telefone1));
    if (payload.telefone2) {
      payload.telefone2 = limparTelefone(String(payload.telefone2));
    }

    // Atualizar cliente
    await gestorPool.execute(
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

    // Atualizar convênios do cliente
    if (convenios && convenios.length > 0) {
      // Remover convênios existentes
      await gestorPool.execute(
        "DELETE FROM convenios_clientes WHERE cliente_id = ?",
        [id]
      );

      // Adicionar novos convênios
      for (const convenioId of convenios) {
        const descontoValue = desconto[convenioId];
        const descontoFinal =
          typeof descontoValue === "number" && !isNaN(descontoValue)
            ? descontoValue
            : 0;

        await gestorPool.execute(
          "INSERT INTO convenios_clientes (convenio_id, cliente_id, desconto) VALUES (?, ?, ?)",
          [convenioId, id, descontoFinal]
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar cliente
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

    // Soft delete - marcar como inativo
    await gestorPool.execute(
      'UPDATE clientes SET status = "Inativo" WHERE id = ?',
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar cliente:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
