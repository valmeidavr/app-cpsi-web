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
    const total = (countRows as any[])[0]?.total || 0;

    // 3. Query para buscar os dados com paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const dataQuery = `
      SELECT DISTINCT id, nome, email, cpf, dtnascimento, cep, logradouro, bairro, cidade, 
                     uf, telefone1, telefone2, status, tipo, createdAt, updatedAt
      FROM clientes${whereClause}
      ORDER BY nome ASC, id ASC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...queryParams, parseInt(limit), offset];
    
    const clienteRows = await executeWithRetry(gestorPool, dataQuery, dataParams);

    return NextResponse.json({
      data: (clienteRows as any[])[0],
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
    const body: CreateClienteDTO = await request.json();

    // Formatar dados
    if (body.dtnascimento) {
      const parsedDate = new Date(body.dtnascimento);
      body.dtnascimento = getDateOnlyUTCISO(parsedDate);
    }
    body.cpf = limparCPF(String(body.cpf));
    if (body.cep) {
      body.cep = limparCEP(String(body.cep));
    }
    body.telefone1 = limparTelefone(String(body.telefone1));
    if (body.telefone2) {
      body.telefone2 = limparTelefone(String(body.telefone2));
    }

    const { convenios, desconto = {}, ...payload } = body;

    // Inserir cliente
    const [result] = await gestorPool.execute(
      `INSERT INTO clientes (
        nome, email, cpf, dtnascimento, cep, logradouro, bairro, cidade, 
        uf, telefone1, telefone2, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      ]
    );

    const clienteId = (result as any).insertId;

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

    const body: UpdateClienteDTO = await request.json();

    // Formatar dados
    if (body.dtnascimento) {
      const parsedDate = new Date(body.dtnascimento);
      body.dtnascimento = getDateOnlyUTCISO(parsedDate);
    }
    body.cpf = limparCPF(String(body.cpf));
    if (body.cep) {
      body.cep = limparCEP(String(body.cep));
    }
    body.telefone1 = limparTelefone(String(body.telefone1));
    if (body.telefone2) {
      body.telefone2 = limparTelefone(String(body.telefone2));
    }

    const { convenios, desconto = {}, ...payload } = body;

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
