import { NextRequest, NextResponse } from "next/server";
import { accessPool, executeWithRetry } from "@/lib/mysql";
import { z } from "zod";
import { createPrestadorSchema, updatePrestadorSchema } from "./schema/formSchemaPretadores";
const updatePrestadorStatusSchema = z.object({
  status: z.enum(["Ativo", "Inativo"], { message: "Status deve ser 'Ativo' ou 'Inativo'" }),
});
export type CreatePrestadorDTO = z.infer<typeof createPrestadorSchema>;
export type UpdatePrestadorDTO = z.infer<typeof updatePrestadorSchema>;
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';
    const all = searchParams.get('all') || '';
    const comExpediente = searchParams.get('com_expediente') || '';
    const unidadeId = searchParams.get('unidade_id') || '';
    const especialidadeId = searchParams.get('especialidade_id') || '';
    if (all === 'true' || limit === '1000') {
      let query = 'SELECT * FROM prestadores ORDER BY status DESC, nome ASC';
      
      if (comExpediente === 'true') {
        let whereClause = ' WHERE 1=1';
        let queryParams: any[] = [];
        
        if (unidadeId) {
          whereClause += ' AND a.unidade_id = ?';
          queryParams.push(parseInt(unidadeId));
        }
        
        if (especialidadeId) {
          whereClause += ' AND a.especialidade_id = ?';
          queryParams.push(parseInt(especialidadeId));
        }
        
        query = `
          SELECT DISTINCT p.* FROM prestadores p
          INNER JOIN alocacoes a ON p.id = a.prestador_id
          INNER JOIN expedientes e ON a.id = e.alocacao_id
          ${whereClause}
          ORDER BY p.status DESC, p.nome ASC
        `;
        
        const [rows] = await accessPool.execute(query, queryParams);
        return NextResponse.json({
          data: rows,
          pagination: {
            page: 1,
            limit: (rows as Array<any>).length,
            total: (rows as Array<any>).length,
            totalPages: 1
          }
        });
      }
      
      const [rows] = await accessPool.execute(query);
      return NextResponse.json({
        data: rows,
        pagination: {
          page: 1,
          limit: (rows as Array<any>).length,
          total: (rows as Array<any>).length,
          totalPages: 1
        }
      });
    }
    let baseQuery = 'prestadores p';
    let selectQuery = 'p.*';
    let whereClause = ' WHERE 1=1';
    const queryParams: (string | number)[] = [];
    
    if (comExpediente === 'true') {
      baseQuery = 'prestadores p INNER JOIN alocacoes a ON p.id = a.prestador_id INNER JOIN expedientes e ON a.id = e.alocacao_id';
      selectQuery = 'DISTINCT p.*';
    }
    
    if (unidadeId) {
      whereClause += ' AND a.unidade_id = ?';
      queryParams.push(parseInt(unidadeId));
    }
    
    if (especialidadeId) {
      whereClause += ' AND a.especialidade_id = ?';
      queryParams.push(parseInt(especialidadeId));
    }
    
    if (search) {
      whereClause += ' AND (p.nome LIKE ? OR p.cpf LIKE ? OR p.rg LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    const countQuery = `SELECT COUNT(${comExpediente === 'true' ? 'DISTINCT p.id' : '*'}) as total FROM ${baseQuery}${whereClause}`;
    const countRows = await executeWithRetry(accessPool, countQuery, queryParams);
    const total = (countRows as Array<{ total: number }>)[0]?.total || 0;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const dataQuery = `
      SELECT ${selectQuery} FROM ${baseQuery}${whereClause}
      ORDER BY p.status DESC, p.nome ASC
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `;
    const dataParams = [...queryParams];
    const prestadorRows = await executeWithRetry(accessPool, dataQuery, dataParams);
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
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
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
    const result = await executeWithRetry(accessPool,
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
    await executeWithRetry(accessPool,
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
    await executeWithRetry(accessPool,
      'UPDATE prestadores SET status = ? WHERE id = ?',
      [status, id]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
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
    await accessPool.execute(
      'UPDATE prestadores SET status = "Inativo" WHERE id = ?',
      [id]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}