import { NextRequest, NextResponse } from "next/server";
import { accessPool, executeWithRetry } from "@/lib/mysql";
import { z } from "zod";
import { createEspecialidadeSchema, updateEspecialidadeSchema } from "./schema/formSchemaEspecialidade";
export type CreateEspecialidadeDTO = z.infer<typeof createEspecialidadeSchema>;
export type UpdateEspecialidadeDTO = z.infer<typeof updateEspecialidadeSchema>;
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';
    const all = searchParams.get('all') || '';
    if (all === 'true' || limit === '1000') {
      try {
        const [rows] = await accessPool.execute(
          'SELECT * FROM especialidades WHERE status = "Ativo" ORDER BY nome ASC'
        );
        console.log('🔍 Debug - Especialidades ativas encontradas:', (rows as Array<{
          id: number;
          nome: string;
          status: string;
          createdAt: Date;
          updatedAt: Date;
        }>).length);
        if ((rows as Array<{
          id: number;
          nome: string;
          status: string;
          createdAt: Date;
          updatedAt: Date;
        }>).length > 0) {
          return NextResponse.json({
            data: rows,
            pagination: {
              page: 1,
              limit: (rows as Array<{
                id: number;
                nome: string;
                status: string;
                createdAt: Date;
                updatedAt: Date;
              }>).length,
              total: (rows as Array<{
                id: number;
                nome: string;
                status: string;
                createdAt: Date;
                updatedAt: Date;
              }>).length,
              totalPages: 1
            }
          });
        }
        const [allRows] = await accessPool.execute(
          'SELECT * FROM especialidades ORDER BY nome ASC'
        );
        console.log('🔍 Debug - Total de especialidades (sem filtro):', (allRows as Array<{
          id: number;
          nome: string;
          status: string;
          createdAt: Date;
          updatedAt: Date;
        }>).length);
        return NextResponse.json({
          data: allRows,
          pagination: {
            page: 1,
            limit: (allRows as Array<{
              id: number;
              nome: string;
              status: string;
              createdAt: Date;
              updatedAt: Date;
            }>).length,
            total: (allRows as Array<{
              id: number;
              nome: string;
              status: string;
              createdAt: Date;
              updatedAt: Date;
            }>).length,
            totalPages: 1
          }
        });
      } catch (queryError) {
        try {
          const [simpleRows] = await accessPool.execute(
            'SELECT id, nome FROM especialidades ORDER BY nome ASC'
          );
          console.log('🔍 Debug - Especialidades via query simples:', (simpleRows as Array<{
            id: number;
            nome: string;
          }>).length);
          return NextResponse.json({
            data: simpleRows,
            pagination: {
              page: 1,
              limit: (simpleRows as Array<{
                id: number;
                nome: string;
              }>).length,
              total: (simpleRows as Array<{
                id: number;
                nome: string;
              }>).length,
              totalPages: 1
            }
          });
        } catch (fallbackError) {
          throw queryError; // Re-throw o erro original
        }
      }
    }
    let whereClause = ' WHERE status = "Ativo"';
    const queryParams: (string | number)[] = [];
    if (search) {
      whereClause += ' AND nome LIKE ?';
      queryParams.push(`%${search}%`);
    }
    const countQuery = `SELECT COUNT(*) as total FROM especialidades${whereClause}`;
    const countRows = await executeWithRetry(accessPool, countQuery, queryParams);
    const total = (countRows as Array<{ total: number }>)[0]?.total || 0;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const dataQuery = `
      SELECT * FROM especialidades${whereClause}
      ORDER BY nome ASC
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `;
    const especialidadeRows = await executeWithRetry(accessPool, dataQuery, queryParams);
    return NextResponse.json({
      data: especialidadeRows,
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
    console.log('🔍 POST especialidades - body recebido:', body);
    
    const validatedData = createEspecialidadeSchema.safeParse(body);
    if (!validatedData.success) {
      console.log('❌ POST especialidades - dados inválidos:', validatedData.error.flatten());
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }
    
    const { ...payload } = validatedData.data;
    console.log('✅ POST especialidades - dados validados:', payload);
    
    const result = await executeWithRetry(accessPool,
      `INSERT INTO especialidades (
        nome, codigo, status, createdAt, updatedAt
      ) VALUES (?, ?, ?, NOW(), NOW())`,
      [
        payload.nome, payload.codigo, 'Ativo'
      ]
    );
    
    console.log('✅ POST especialidades - inserção bem sucedida:', result);
    
    return NextResponse.json({ 
      success: true, 
      id: (result as { insertId: number }).insertId 
    });
  } catch (error) {
    console.error('❌ POST especialidades - erro:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.flatten() },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
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
        { error: 'ID da especialidade é obrigatório' },
        { status: 400 }
      );
    }
    const body = await request.json();
    const validatedData = updateEspecialidadeSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }
    const { ...payload } = validatedData.data;
    await executeWithRetry(accessPool,
      `UPDATE especialidades SET 
        nome = ?, codigo = ?, updatedAt = NOW()
       WHERE id = ?`,
      [
        payload.nome, payload.codigo, id
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
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { error: 'ID da especialidade é obrigatório' },
        { status: 400 }
      );
    }
    await executeWithRetry(accessPool,
      'UPDATE especialidades SET status = "Inativo" WHERE id = ?',
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