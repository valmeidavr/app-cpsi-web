import { NextRequest, NextResponse } from "next/server";
import { accessPool, executeWithRetry } from "@/lib/mysql";
import { z } from "zod";
import { createTurmaSchema, updateTurmaSchema } from "./schema/formSchemaTurmas";
export type CreateTurmaDTO = z.infer<typeof createTurmaSchema>;
export type UpdateTurmaDTO = z.infer<typeof updateTurmaSchema>;
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [TURMAS API] Iniciando requisição GET - Updated');
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';
    
    console.log('📊 [TURMAS API] Parâmetros:', { page, limit, search });
    let query = `
      SELECT 
        t.id,
        t.nome,
        t.horario as horario_inicio,
        t.horario as horario_fim,
        t.dataInicio as data_inicio,
        t.dataFim as data_fim,
        t.limiteVagas as limite_vagas,
        t.procedimento_id,
        t.prestador_id,
        COALESCE(p.nome, 'Procedimento não definido') as procedimento_nome,
        COALESCE(pr.nome, 'Prestador não definido') as prestador_nome
      FROM turmas t
      LEFT JOIN procedimentos p ON t.procedimento_id = p.id
      LEFT JOIN prestadores pr ON t.prestador_id = pr.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];
    if (search) {
      query += ' AND (t.nome LIKE ? OR p.nome LIKE ? OR pr.nome LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY nome ASC LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    
    console.log('🔍 [TURMAS API] Query principal:', query);
    console.log('📊 [TURMAS API] Parâmetros da query:', params);
    
    const [turmaRows] = await accessPool.execute(query, params);
    console.log('✅ [TURMAS API] Query executada com sucesso. Resultados:', turmaRows);
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM turmas t
      LEFT JOIN procedimentos p ON t.procedimento_id = p.id
      LEFT JOIN prestadores pr ON t.prestador_id = pr.id
      WHERE 1=1
    `;
    const countParams: (string | number)[] = [];
    if (search) {
      countQuery += ' AND (t.nome LIKE ? OR p.nome LIKE ? OR pr.nome LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    console.log('🔍 [TURMAS API] Query de contagem:', countQuery);
    console.log('📊 [TURMAS API] Parâmetros da contagem:', countParams);
    
    const [countRows] = await accessPool.execute(countQuery, countParams);
    console.log('✅ [TURMAS API] Query de contagem executada. Resultado:', countRows);
    
    const total = (countRows as Array<{ total: number }>)[0]?.total || 0;
    console.log('📊 [TURMAS API] Total de registros:', total);
    
    const response = {
      data: turmaRows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
    
    console.log('✅ [TURMAS API] Resposta final:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ [TURMAS API] Erro na execução:', error);
    console.error('❌ [TURMAS API] Stack trace:', error instanceof Error ? error.stack : 'N/A');
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    console.log('📝 [TURMAS API] Iniciando requisição POST');
    const body = await request.json();
    console.log('📊 [TURMAS API] Dados recebidos:', body);
    
    const validatedData = createTurmaSchema.safeParse(body);
    if (!validatedData.success) {
      console.error('❌ [TURMAS API] Erro de validação:', validatedData.error.flatten());
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }
    
    const { ...payload } = validatedData.data;
    console.log('✅ [TURMAS API] Dados validados:', payload);
    
    const query = `INSERT INTO turmas (
        nome, horario, dataInicio, dataFim, limiteVagas, 
        procedimento_id, prestador_id, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
      
    console.log('🔍 [TURMAS API] Query INSERT:', query);
    
    const result = await executeWithRetry(accessPool,
      query,
      [
        payload.nome, 
        payload.horario_inicio, // será usado como horario
        payload.data_inicio, 
        null, // data_fim começa como null
        payload.limite_vagas, 
        payload.procedimento_id, 
        payload.prestador_id 
      ]
    );
    
    console.log('✅ [TURMAS API] Turma criada com sucesso:', result);
    return NextResponse.json({ 
      success: true, 
      id: (result as { insertId: number }).insertId 
    });
  } catch (error) {
    console.error('❌ [TURMAS API] Erro ao criar turma:', error);
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
    console.log('📝 [TURMAS API] Iniciando requisição PUT');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { error: 'ID da turma é obrigatório' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    console.log('📊 [TURMAS API] Dados recebidos para atualização:', body);
    
    const validatedData = updateTurmaSchema.safeParse(body);
    if (!validatedData.success) {
      console.error('❌ [TURMAS API] Erro de validação:', validatedData.error.flatten());
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }
    
    const { ...payload } = validatedData.data;
    console.log('✅ [TURMAS API] Dados validados:', payload);
    
    const query = `UPDATE turmas SET 
        nome = ?, horario = ?, dataInicio = ?,
        limiteVagas = ?, procedimento_id = ?, prestador_id = ?, updatedAt = NOW()
       WHERE id = ?`;
       
    console.log('🔍 [TURMAS API] Query UPDATE:', query);
    
    await executeWithRetry(accessPool,
      query,
      [
        payload.nome, 
        payload.horario_inicio, // será usado como horario
        payload.data_inicio, 
        payload.limite_vagas, 
        payload.procedimento_id, 
        payload.prestador_id, 
        id
      ]
    );
    
    console.log('✅ [TURMAS API] Turma atualizada com sucesso');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ [TURMAS API] Erro ao atualizar turma:', error);
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
    console.log('🗑️ [TURMAS API] Iniciando requisição DELETE');
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      console.error('❌ [TURMAS API] ID não fornecido');
      return NextResponse.json(
        { error: 'ID da turma é obrigatório' },
        { status: 400 }
      );
    }
    
    console.log('🔍 [TURMAS API] Deletando turma com ID:', id);
    
    await executeWithRetry(accessPool,
      'DELETE FROM turmas WHERE id = ?',
      [id]
    );
    
    console.log('✅ [TURMAS API] Turma deletada com sucesso');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ [TURMAS API] Erro ao deletar turma:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}