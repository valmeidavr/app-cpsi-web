import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";
import { z } from "zod";
import { createProcedimentoSchema, updateProcedimentoSchema } from "./schema/formSchemaProcedimentos";
export type CreateProcedimentoDTO = z.infer<typeof createProcedimentoSchema>;
export type UpdateProcedimentoDTO = z.infer<typeof updateProcedimentoSchema>;
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [PROCEDIMENTOS API] Iniciando requisição GET');
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';
    
    console.log('📊 [PROCEDIMENTOS API] Parâmetros:', { page, limit, search });
    let query = 'SELECT * FROM procedimentos';
    const params: (string | number)[] = [];
    if (search) {
      query += ' WHERE (nome LIKE ? OR codigo LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY status DESC, nome ASC LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    
    console.log('🔍 [PROCEDIMENTOS API] Query principal:', query);
    console.log('📊 [PROCEDIMENTOS API] Parâmetros da query:', params);
    const [procedimentoRows] = await accessPool.execute(query, params);
    console.log('✅ [PROCEDIMENTOS API] Query executada com sucesso. Resultados:', procedimentoRows);
    let countQuery = 'SELECT COUNT(*) as total FROM procedimentos';
    const countParams: (string)[] = [];
    if (search) {
      countQuery += ' WHERE (nome LIKE ? OR codigo LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }
    
    console.log('🔍 [PROCEDIMENTOS API] Query de contagem:', countQuery);
    const [countRows] = await accessPool.execute(countQuery, countParams);
    const total = (countRows as Array<{ total: number }>)[0]?.total || 0;
    
    console.log('📊 [PROCEDIMENTOS API] Total de registros:', total);
    const response = {
      data: procedimentoRows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
    
    console.log('✅ [PROCEDIMENTOS API] Resposta final:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ [PROCEDIMENTOS API] Erro na execução:', error);
    console.error('❌ [PROCEDIMENTOS API] Stack trace:', error instanceof Error ? error.stack : 'N/A');
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    console.log('📝 [PROCEDIMENTOS API] Iniciando requisição POST');
    const body = await request.json();
    console.log('📊 [PROCEDIMENTOS API] Dados recebidos:', body);
    
    const validatedData = createProcedimentoSchema.safeParse(body);
    if (!validatedData.success) {
      console.error('❌ [PROCEDIMENTOS API] Erro de validação:', validatedData.error.flatten());
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }
    
    const { ...payload } = validatedData.data;
    console.log('✅ [PROCEDIMENTOS API] Dados validados:', payload);
    const query = `INSERT INTO procedimentos (
        nome, codigo, especialidade_id, status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, NOW(), NOW())`;
      
    console.log('🔍 [PROCEDIMENTOS API] Query INSERT:', query);
    
    const [result] = await accessPool.execute(
      query,
      [
        payload.nome, payload.codigo, payload.especialidade_id, 'Ativo'
      ]
    );
    
    console.log('✅ [PROCEDIMENTOS API] Procedimento criado com sucesso:', result);
    return NextResponse.json({ 
      success: true, 
      id: (result as { insertId: number }).insertId 
    });
  } catch (error) {
    console.error('❌ [PROCEDIMENTOS API] Erro ao criar procedimento:', error);
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
        { error: 'ID do procedimento é obrigatório' },
        { status: 400 }
      );
    }
    const body = await request.json();
    const validatedData = updateProcedimentoSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }
    const { ...payload } = validatedData.data;
    await executeWithRetry(accessPool,
      `UPDATE procedimentos SET 
        nome = ?, codigo = ?, tipo = ?, especialidade_id = ?, updatedAt = NOW()
       WHERE id = ?`,
      [
        payload.nome, payload.codigo, payload.tipo, payload.especialidade_id, id
      ]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ [PROCEDIMENTOS API] Erro ao atualizar procedimento:', error);
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
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ [PROCEDIMENTOS API] Iniciando requisição DELETE');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      console.error('❌ [PROCEDIMENTOS API] ID não fornecido');
      return NextResponse.json(
        { error: 'ID do procedimento é obrigatório' },
        { status: 400 }
      );
    }
    
    console.log('🔍 [PROCEDIMENTOS API] Inativando procedimento com ID:', id);
    
    await executeWithRetry(accessPool,
      'UPDATE procedimentos SET status = "Inativo" WHERE id = ?',
      [id]
    );
    
    console.log('✅ [PROCEDIMENTOS API] Procedimento inativado com sucesso');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ [PROCEDIMENTOS API] Erro ao inativar procedimento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}