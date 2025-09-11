import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";
import { z } from "zod";
import { createPlanosSchema, updatePlanosSchema } from "./schema/formSchemaPlanos";
export type CreatePlanoContaDTO = z.infer<typeof createPlanosSchema>;
export type UpdatePlanoContaDTO = z.infer<typeof updatePlanosSchema>;
export async function GET(request: NextRequest) {
  try {
    console.log('📥 [PLANO_CONTAS GET] Iniciando busca de plano de contas');
    
    // Verificar se a tabela existe
    try {
      const [tableCheck] = await accessPool.execute("SHOW TABLES LIKE 'plano_contas'");
      console.log('🔍 [PLANO_CONTAS GET] Tabela existe:', (tableCheck as any[]).length > 0);
      
      if ((tableCheck as any[]).length === 0) {
        console.log('⚠️ [PLANO_CONTAS GET] Tabela plano_contas não existe, criando...');
        await accessPool.execute(`
          CREATE TABLE IF NOT EXISTS plano_contas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nome VARCHAR(255) NOT NULL,
            tipo ENUM('RECEITA', 'DESPESA') NOT NULL,
            categoria VARCHAR(100),
            descricao TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);
        console.log('✅ [PLANO_CONTAS GET] Tabela criada com sucesso');
      }
    } catch (tableError) {
      console.error('❌ [PLANO_CONTAS GET] Erro ao verificar/criar tabela:', tableError);
    }
    
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';
    console.log('📝 [PLANO_CONTAS GET] Parâmetros:', { page, limit, search });
    
    let query = 'SELECT * FROM plano_contas WHERE 1=1';
    const params: (string | number)[] = [];
    console.log('🔍 [PLANO_CONTAS GET] Query base:', query);
    if (search) {
      query += ' AND (nome LIKE ? OR categoria LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY nome ASC LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    console.log('💾 [PLANO_CONTAS GET] Query final:', query);
    console.log('📋 [PLANO_CONTAS GET] Parâmetros da query:', params);
    
    const [planoRows] = await accessPool.execute(query, params);
    console.log('✅ [PLANO_CONTAS GET] Query executada, resultados encontrados:', (planoRows as any[]).length);
    let countQuery = 'SELECT COUNT(*) as total FROM plano_contas WHERE 1=1';
    const countParams: (string)[] = [];
    if (search) {
      countQuery += ' AND (nome LIKE ? OR categoria LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }
    const [countRows] = await accessPool.execute(countQuery, countParams);
    const total = (countRows as Array<{ total: number }>)[0]?.total || 0;
    console.log('📊 [PLANO_CONTAS GET] Total de registros:', total);
    
    console.log('🎯 [PLANO_CONTAS GET] Retornando resposta com sucesso');
    return NextResponse.json({
      data: planoRows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ [PLANO_CONTAS GET] Erro detalhado:', error);
    console.error('❌ [PLANO_CONTAS GET] Stack trace:', error instanceof Error ? error.stack : 'Sem stack trace');
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? {
          message: error instanceof Error ? error.message : 'Erro desconhecido',
          stack: error instanceof Error ? error.stack : null
        } : undefined
      },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createPlanosSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }
    const { ...payload } = validatedData.data;
    const [result] = await accessPool.execute(
      `INSERT INTO plano_contas (
        nome, tipo, categoria, descricao
      ) VALUES (?, ?, ?, ?)`,
      [
        payload.nome, payload.tipo, payload.categoria, payload.descricao
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