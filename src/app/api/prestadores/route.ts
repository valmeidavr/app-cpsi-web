import { NextRequest, NextResponse } from "next/server";
import { gestorPool, executeWithRetry } from "@/lib/mysql";
import { z } from "zod";
import { createPrestadorSchema, updatePrestadorSchema } from "./schema/formSchemaPretadores";

const updatePrestadorStatusSchema = z.object({
  status: z.enum(["Ativo", "Inativo"], { message: "Status deve ser 'Ativo' ou 'Inativo'" }),
});

export type CreatePrestadorDTO = z.infer<typeof createPrestadorSchema>;
export type UpdatePrestadorDTO = z.infer<typeof updatePrestadorSchema>;

// GET - Listar prestadores com paginação e busca
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';
    const all = searchParams.get('all') || '';

    // Se for para retornar todos os prestadores (sem paginação)
    if (all === 'true' || limit === '1000') {
      console.log('🔍 Debug - Buscando todos os prestadores ativos');
      const [rows] = await gestorPool.execute(
        'SELECT * FROM prestadores WHERE status = "Ativo" ORDER BY nome ASC'
      );
      console.log('🔍 Debug - Prestadores encontrados:', (rows as Array<{
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
      }>).length);
      return NextResponse.json({
        data: rows,
        pagination: {
          page: 1,
          limit: (rows as Array<{
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
          }>).length,
          total: (rows as Array<{
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
          }>).length,
          totalPages: 1
        }
      });
    }

    // 1. Construir a cláusula WHERE dinamicamente
    let whereClause = ' WHERE status = "Ativo"'; // Mostrar apenas prestadores ativos
    const queryParams: (string | number)[] = [];

    if (search) {
      whereClause += ' AND (nome LIKE ? OR cpf LIKE ? OR rg LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // 2. Query para contar o total de registros
    const countQuery = `SELECT COUNT(*) as total FROM prestadores${whereClause}`;
    const countRows = await executeWithRetry(gestorPool, countQuery, queryParams);
    const total = (countRows as Array<{ total: number }>)[0]?.total || 0;

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
    const body = await request.json();
    const validatedData = createPrestadorSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    const { ...payload } = validatedData.data;

    // Inserir prestador
    const [result] = await gestorPool.execute(
      `INSERT INTO prestadores (
        nome, rg, cpf, sexo, dtnascimento, cep, logradouro, numero, 
        bairro, cidade, uf, telefone, celular, complemento, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.nome, payload.rg, payload.cpf, payload.sexo, payload.dtnascimento,
        payload.cep, payload.logradouro, payload.numero, payload.bairro,
        payload.cidade, payload.uf, payload.telefone, payload.celular,
        payload.complemento, 'Ativo'
      ]
    );

    return NextResponse.json({ 
      success: true, 
      id: (result as { insertId: number }).insertId 
    });
  } catch (error) {
    console.error('Erro ao criar prestador:', error);
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

    const body = await request.json();
    const validatedData = updatePrestadorSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    const { ...payload } = validatedData.data;

    // Atualizar prestador
    await gestorPool.execute(
      `UPDATE prestadores SET 
        nome = ?, rg = ?, cpf = ?, sexo = ?, dtnascimento = ?, cep = ?,
        logradouro = ?, numero = ?, bairro = ?, cidade = ?, uf = ?,
        telefone = ?, celular = ?, complemento = ?
       WHERE id = ?`,
      [
        payload.nome, payload.rg, payload.cpf, payload.sexo, payload.dtnascimento,
        payload.cep, payload.logradouro, payload.numero, payload.bairro,
        payload.cidade, payload.uf, payload.telefone, payload.celular,
        payload.complemento, id
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar prestador:', error);
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

// PATCH - Alterar status do prestador
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do prestador é obrigatório' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updatePrestadorStatusSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    const { status } = validatedData.data;

    // Atualizar status do prestador
    await gestorPool.execute(
      'UPDATE prestadores SET status = ? WHERE id = ?',
      [status, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao alterar status do prestador:', error);
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