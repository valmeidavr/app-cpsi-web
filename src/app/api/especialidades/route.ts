import { NextRequest, NextResponse } from "next/server";
import { gestorPool, executeWithRetry } from "@/lib/mysql";
import { z } from "zod";
import { createEspecialidadeSchema, updateEspecialidadeSchema } from "./schema/formSchemaEspecialidade";

export type CreateEspecialidadeDTO = z.infer<typeof createEspecialidadeSchema>;
export type UpdateEspecialidadeDTO = z.infer<typeof updateEspecialidadeSchema>;

// GET - Listar especialidades com paginação e busca
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';
    const all = searchParams.get('all') || '';

    // Se for para retornar todas as especialidades (sem paginação)
    if (all === 'true' || limit === '1000') {
      console.log('🔍 Debug - Buscando todas as especialidades ativas');
      
      try {
        // Primeiro, tentar buscar com filtro de status
        const [rows] = await gestorPool.execute(
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
        
        // Se não encontrar especialidades ativas, buscar todas
        console.log('🔍 Debug - Nenhuma especialidade ativa encontrada, buscando todas...');
        const [allRows] = await gestorPool.execute(
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
        console.error('🔍 Debug - Erro na query de especialidades:', queryError);
        
        // Tentar query mais simples como fallback
        try {
          const [simpleRows] = await gestorPool.execute(
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
          console.error('🔍 Debug - Erro no fallback:', fallbackError);
          throw queryError; // Re-throw o erro original
        }
      }
    }

    // 1. Construir a cláusula WHERE dinamicamente
    let whereClause = ' WHERE status = "Ativo"';
    const queryParams: (string | number)[] = [];

    if (search) {
      whereClause += ' AND nome LIKE ?';
      queryParams.push(`%${search}%`);
    }

    // 2. Query para contar o total de registros
    const countQuery = `SELECT COUNT(*) as total FROM especialidades${whereClause}`;
    const countRows = await executeWithRetry(gestorPool, countQuery, queryParams);
    const total = (countRows as Array<{ total: number }>)[0]?.total || 0;

    // 3. Query para buscar os dados com paginação
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const dataQuery = `
      SELECT * FROM especialidades${whereClause}
      ORDER BY nome ASC
      LIMIT ? OFFSET ?
    `;
    const dataParams = [...queryParams, parseInt(limit), offset];
    const especialidadeRows = await executeWithRetry(gestorPool, dataQuery, dataParams);

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
    console.error('Erro ao buscar especialidades:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar especialidade
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createEspecialidadeSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    const { ...payload } = validatedData.data;

    // Inserir especialidade
    const [result] = await gestorPool.execute(
      `INSERT INTO especialidades (
        nome, codigo, status
      ) VALUES (?, ?, ?)`,
      [
        payload.nome, payload.codigo, 'Ativo'
      ]
    );

    return NextResponse.json({ 
      success: true, 
      id: (result as { insertId: number }).insertId 
    });
  } catch (error) {
    console.error('Erro ao criar especialidade:', error);
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

// PUT - Atualizar especialidade
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

    // Atualizar especialidade
    await gestorPool.execute(
      `UPDATE especialidades SET 
        nome = ?, codigo = ?
       WHERE id = ?`,
      [
        payload.nome, payload.codigo, id
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar especialidade:', error);
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

// DELETE - Deletar especialidade
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

    // Soft delete - marcar como inativo
    await gestorPool.execute(
      'UPDATE especialidades SET status = "Inativo" WHERE id = ?',
      [id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar especialidade:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}