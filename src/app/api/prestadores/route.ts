import { NextRequest, NextResponse } from "next/server";
import { gestorPool, executeWithRetry } from "@/lib/mysql";
import { z } from "zod";
import { createPrestadorSchema, updatePrestadorSchema } from "./schema/formSchemaPretadores";

export type CreatePrestadorDTO = z.infer<typeof createPrestadorSchema>;
export type UpdatePrestadorDTO = z.infer<typeof updatePrestadorSchema>;

// GET - Listar prestadores com paginação e busca
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
      whereClause = ' WHERE (nome LIKE ? OR cpf LIKE ? OR email LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // 2. Query para contar o total de registros
    const countQuery = `SELECT COUNT(*) as total FROM prestadores${whereClause}`;
    const countRows = await executeWithRetry(gestorPool, countQuery, queryParams);
    const total = (countRows as any[])[0]?.total || 0;

    // 3. Query para buscar os dados com paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const dataQuery = `
      SELECT * FROM prestadores${whereClause}
      ORDER BY nome ASC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...queryParams, parseInt(limit), offset];
    const prestadorRows = await executeWithRetry(gestorPool, dataQuery, dataParams);

    return NextResponse.json({
      data: prestadorRows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar prestadores:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar prestador
export async function POST(request: NextRequest) {
  try {
    const body: CreatePrestadorDTO = await request.json();

    // Inserir prestador
    const [result] = await gestorPool.execute(
      `INSERT INTO prestadores (
        nome, rg, cpf, sexo, dtnascimento, cep, logradouro, numero, 
        bairro, cidade, uf, telefone, celular, complemento, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        body.nome, body.rg, body.cpf, body.sexo, body.dtnascimento,
        body.cep, body.logradouro, body.numero, body.bairro,
        body.cidade, body.uf, body.telefone, body.celular,
        body.complemento, 'Ativo'
      ]
    );

    return NextResponse.json({ 
      success: true, 
      id: (result as any).insertId 
    });
  } catch (error) {
    console.error('Erro ao criar prestador:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 

// PUT - Atualizar prestador
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do prestador é obrigatório' },
        { status: 400 }
      );
    }

    const body: UpdatePrestadorDTO = await request.json();

    // Atualizar prestador
    await gestorPool.execute(
      `UPDATE prestadores SET 
        nome = ?, rg = ?, cpf = ?, sexo = ?, dtnascimento = ?, cep = ?,
        logradouro = ?, numero = ?, bairro = ?, cidade = ?, uf = ?,
        telefone = ?, celular = ?, complemento = ?
       WHERE id = ?`,
      [
        body.nome, body.rg, body.cpf, body.sexo, body.dtnascimento,
        body.cep, body.logradouro, body.numero, body.bairro,
        body.cidade, body.uf, body.telefone, body.celular,
        body.complemento, id
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

// DELETE - Deletar prestador
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do prestador é obrigatório' },
        { status: 400 }
      );
    }

    // Soft delete - marcar como inativo
    await gestorPool.execute(
      'UPDATE prestadores SET status = "Inativo" WHERE id = ?',
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar prestador:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 