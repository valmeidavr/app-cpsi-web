import { NextRequest, NextResponse } from "next/server";
import { accessPool, executeWithRetry } from "@/lib/mysql";
import { z } from "zod";
import { createConvenioSchema, updateConvenioSchema } from "./schema/formSchemaConvenios";
export type CreateConvenioDTO = z.infer<typeof createConvenioSchema>;
export type UpdateConvenioDTO = z.infer<typeof updateConvenioSchema>;
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [CONVENIOS API] Iniciando requisição GET');
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';
    
    console.log('📊 [CONVENIOS API] Parâmetros:', { page, limit, search });
    
    let query = 'SELECT id, nome, desconto, regras, tabela_faturamento_id FROM convenios';
    const params: (string | number)[] = [];
    if (search) {
      query += ' WHERE (nome LIKE ? OR regras LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY nome ASC LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    
    console.log('🔍 [CONVENIOS API] Query principal:', query);
    console.log('📊 [CONVENIOS API] Parâmetros da query:', params);
    
    const [convenioRows] = await accessPool.execute(query, params);
    console.log('✅ [CONVENIOS API] Query executada com sucesso. Resultados:', convenioRows);
    
    let countQuery = 'SELECT COUNT(*) as total FROM convenios';
    const countParams: (string)[] = [];
    if (search) {
      countQuery += ' WHERE (nome LIKE ? OR regras LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }
    
    console.log('🔍 [CONVENIOS API] Query de contagem:', countQuery);
    const [countRows] = await accessPool.execute(countQuery, countParams);
    const total = (countRows as Array<{ total: number }>)[0]?.total || 0;
    
    console.log('📊 [CONVENIOS API] Total de registros:', total);
    
    const response = {
      data: convenioRows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
    
    console.log('✅ [CONVENIOS API] Resposta final:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ [CONVENIOS API] Erro na execução:', error);
    console.error('❌ [CONVENIOS API] Stack trace:', error instanceof Error ? error.stack : 'N/A');
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    console.log('📝 [CONVENIOS API] Iniciando requisição POST');
    const body = await request.json();
    console.log('📊 [CONVENIOS API] Dados recebidos:', body);
    
    const validatedData = createConvenioSchema.safeParse(body);
    if (!validatedData.success) {
      console.error('❌ [CONVENIOS API] Erro de validação:', validatedData.error.flatten());
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }
    
    const { ...payload } = validatedData.data;
    console.log('✅ [CONVENIOS API] Dados validados:', payload);
    
    const desconto = payload.desconto !== undefined ? Number(payload.desconto) : 0;
    
    const query = `INSERT INTO convenios (
        nome, desconto, tabela_faturamento_id, createdAt, updatedAt
      ) VALUES (?, ?, ?, NOW(), NOW())`;
      
    console.log('🔍 [CONVENIOS API] Query INSERT:', query);
    
    const [result] = await accessPool.execute(
      query,
      [
        payload.nome, desconto, payload.tabela_faturamento_id
      ]
    );
    
    console.log('✅ [CONVENIOS API] Convênio criado com sucesso:', result);
    return NextResponse.json({ 
      success: true, 
      id: (result as { insertId: number }).insertId 
    });
  } catch (error) {
    console.error('❌ [CONVENIOS API] Erro ao criar convênio:', error);
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
        { error: 'ID do convênio é obrigatório' },
        { status: 400 }
      );
    }
    const body = await request.json();
    const validatedData = updateConvenioSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }
    const { ...payload } = validatedData.data;
    const desconto = payload.desconto !== undefined ? Number(payload.desconto) : 0;
    await executeWithRetry(accessPool,
      `UPDATE convenios SET 
        nome = ?, desconto = ?, regras = ?, tabela_faturamento_id = ?, updatedAt = NOW()
       WHERE id = ?`,
      [
        payload.nome, desconto, payload.regras, payload.tabela_faturamento_id, id
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
    console.log('🗑️ [CONVENIOS API] Iniciando requisição DELETE');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      console.error('❌ [CONVENIOS API] ID não fornecido');
      return NextResponse.json(
        { error: 'ID do convênio é obrigatório' },
        { status: 400 }
      );
    }
    
    console.log('🔍 [CONVENIOS API] Deletando convênio com ID:', id);
    
    await executeWithRetry(accessPool,
      'DELETE FROM convenios WHERE id = ?',
      [id]
    );
    
    console.log('✅ [CONVENIOS API] Convênio deletado com sucesso');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ [CONVENIOS API] Erro ao deletar convênio:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}