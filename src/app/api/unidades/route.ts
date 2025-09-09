import { NextRequest, NextResponse } from "next/server";
import { accessPool, executeWithRetry } from "@/lib/mysql";
import { z } from "zod";
import { createUnidadeSchema, updateUnidadeSchema } from "./schema/formSchemaUnidades";
export type CreateUnidadeDTO = z.infer<typeof createUnidadeSchema>;
export type UpdateUnidadeDTO = z.infer<typeof updateUnidadeSchema>;
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/unidades - Iniciando requisição');
    
    // Verificar/criar tabela se não existir (apenas campos básicos)
    try {
      await executeWithRetry(accessPool, `
        CREATE TABLE IF NOT EXISTS unidades (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY idx_nome (nome)
        )
      `, []);
      console.log('✅ Tabela unidades verificada/criada');
      
      // Verificar se há registros e inserir dados de exemplo se vazio
      const [countResult] = await accessPool.execute('SELECT COUNT(*) as total FROM unidades');
      const count = (countResult as any)[0].total;
      
      if (count === 0) {
        console.log('📝 Inserindo unidades de exemplo...');
        await executeWithRetry(accessPool, `
          INSERT INTO unidades (nome) VALUES 
            ('Unidade Central'),
            ('Unidade Norte'),
            ('Unidade Sul'),
            ('Unidade Leste'),
            ('Unidade Oeste')
        `, []);
        console.log('✅ Unidades de exemplo inseridas');
      }
    } catch (tableError) {
      console.error('⚠️ Erro ao verificar/criar tabela:', tableError);
    }
    
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';
    const all = searchParams.get('all') || '';
    const comExpediente = searchParams.get('com_expediente') || '';
    console.log('📊 Parâmetros:', { page, limit, search, all, comExpediente });
    if (all === 'true' || limit === '1000') {
      let query = 'SELECT * FROM unidades';
      let queryParams: any[] = [];
      
      if (comExpediente === 'true') {
        query = `
          SELECT DISTINCT u.* FROM unidades u
          INNER JOIN alocacoes a ON u.id = a.unidade_id
          INNER JOIN expedientes e ON a.id = e.alocacao_id
          ORDER BY u.nome ASC
        `;
      } else {
        query += ' ORDER BY nome ASC';
      }
      
      const rows = await executeWithRetry(accessPool, query, queryParams);
      console.log('🔍 Debug - Unidades encontradas:', (rows as Array<{
        id: number;
        nome: string;
        created_at: Date;
        updated_at: Date;
      }>).length);
      return NextResponse.json({
        data: rows,
        pagination: {
          page: 1,
          limit: (rows as Array<{
            id: number;
            nome: string;
            created_at: Date;
            updated_at: Date;
          }>).length,
          total: (rows as Array<{
            id: number;
            nome: string;
            created_at: Date;
            updated_at: Date;
          }>).length,
          totalPages: 1
        }
      });
    }
    let baseQuery = 'unidades u';
    let selectQuery = 'u.*';
    let joinClause = '';
    let whereClause = ' WHERE 1=1';
    const queryParams: (string | number)[] = [];
    
    if (comExpediente === 'true') {
      baseQuery = 'unidades u INNER JOIN alocacoes a ON u.id = a.unidade_id INNER JOIN expedientes e ON a.id = e.alocacao_id';
      selectQuery = 'DISTINCT u.*';
    }
    
    if (search) {
      whereClause += ' AND u.nome LIKE ?';
      queryParams.push(`%${search}%`);
    }
    
    const countQuery = `SELECT COUNT(${comExpediente === 'true' ? 'DISTINCT u.id' : '*'}) as total FROM ${baseQuery}${whereClause}`;
    const countRows = await executeWithRetry(accessPool, countQuery, queryParams);
    const total = (countRows as Array<{ total: number }>)[0]?.total || 0;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const dataQuery = `
      SELECT ${selectQuery} FROM ${baseQuery}${whereClause}
      ORDER BY u.nome ASC
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `;
    const unidadeRows = await executeWithRetry(accessPool, dataQuery, queryParams);
    return NextResponse.json({
      data: unidadeRows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Erro em GET /api/unidades:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔍 POST unidades - dados recebidos:', body);
    
    const validatedData = createUnidadeSchema.safeParse(body);
    if (!validatedData.success) {
      console.log('❌ POST unidades - dados inválidos:', validatedData.error.flatten());
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }
    
    const { ...payload } = validatedData.data;
    console.log('✅ POST unidades - dados validados:', payload);
    
    const result = await executeWithRetry(accessPool,
      `INSERT INTO unidades (
        nome, created_at, updated_at
      ) VALUES (?, NOW(), NOW())`,
      [
        payload.nome
      ]
    );
    
    console.log('✅ POST unidades - inserção bem sucedida:', result);
    
    return NextResponse.json({ 
      success: true, 
      id: (result as { insertId: number }).insertId 
    });
  } catch (error) {
    console.error('❌ POST unidades - erro:', error);
    
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
        { error: 'ID da unidade é obrigatório' },
        { status: 400 }
      );
    }
    const body = await request.json();
    const validatedData = updateUnidadeSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }
    const { ...payload } = validatedData.data;
    await executeWithRetry(accessPool,
      `UPDATE unidades SET 
        nome = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        payload.nome,
        id
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
        { error: 'ID da unidade é obrigatório' },
        { status: 400 }
      );
    }
    await executeWithRetry(accessPool,
      'DELETE FROM unidades WHERE id = ?',
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