import { NextRequest, NextResponse } from "next/server";
import { accessPool, executeWithRetry } from "@/lib/mysql";
import { z } from "zod";
import { createAlocacaoSchema, updateAlocacaoSchema } from "./shema/formSchemaAlocacao";
export type CreateAlocacaoDTO = z.infer<typeof createAlocacaoSchema>;
export type UpdateAlocacaoDTO = z.infer<typeof updateAlocacaoSchema>;
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const search = searchParams.get('search') || '';
    const prestadorId = searchParams.get('prestadorId');
    const especialidadeId = searchParams.get('especialidade_id');
    const unidadeId = searchParams.get('unidadeId');
    let query = `
      SELECT 
        a.*,
        e.id as especialidade_id,
        e.nome as especialidade_nome,
        u.id as unidade_id,
        u.nome as unidade_nome,
        p.id as prestador_id,
        p.nome as prestador_nome,
        p.cpf as prestador_cpf,
        p.celular as prestador_celular
      FROM alocacoes a
      LEFT JOIN especialidades e ON a.especialidade_id = e.id
      LEFT JOIN unidades u ON a.unidade_id = u.id
      LEFT JOIN prestadores p ON a.prestador_id = p.id
      WHERE (p.status IS NULL OR p.status = 'Ativo')
    `;
    const params: (string | number)[] = [];
    if (search) {
      query += ' AND (e.nome LIKE ? OR u.nome LIKE ? OR p.nome LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (prestadorId) {
      query += ' AND a.prestador_id = ?';
      params.push(prestadorId);
    }
    if (especialidadeId) {
      query += ' AND a.especialidade_id = ?';
      params.push(especialidadeId);
    }
    if (unidadeId) {
      query += ' AND a.unidade_id = ?';
      params.push(unidadeId);
    }
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY e.nome ASC LIMIT ${parseInt(limit)} OFFSET ${offset}`;
    const alocacaoRows = await executeWithRetry(accessPool, query, params);
    console.log("✅ Alocações encontradas:", (alocacaoRows as Array<{
      id: number;
      unidade_id: number;
      especialidade_id: number;
      prestador_id: number;
      unidade_nome: string;
      especialidade_nome: string;
      prestador_nome: string;
      prestador_cpf: string;
      prestador_celular: string;
      createdAt: Date;
      updatedAt: Date;
    }>)?.length || 0);
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM alocacoes a
      LEFT JOIN especialidades e ON a.especialidade_id = e.id
      LEFT JOIN unidades u ON a.unidade_id = u.id
      LEFT JOIN prestadores p ON a.prestador_id = p.id
      WHERE (p.status IS NULL OR p.status = 'Ativo')
    `;
    const countParams: string[] = [];
    if (search) {
      countQuery += ' AND (e.nome LIKE ? OR u.nome LIKE ? OR p.nome LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const countRows = await executeWithRetry(accessPool, countQuery, countParams);
    const total = (countRows as Array<{ total: number }>)[0]?.total || 0;
    const alocacoesFormatadas = (alocacaoRows as Array<{
      id: number;
      unidade_id: number;
      especialidade_id: number;
      prestador_id: number;
      unidade_nome: string;
      especialidade_nome: string;
      prestador_nome: string;
      prestador_cpf: string;
      prestador_celular: string;
      createdAt: Date;
      updatedAt: Date;
    }>).map((row) => ({
      id: row.id,
      unidade_id: row.unidade_id,
      especialidade_id: row.especialidade_id,
      prestador_id: row.prestador_id,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      unidade_nome: row.unidade_nome,
      especialidade_nome: row.especialidade_nome,
      prestador_nome: row.prestador_nome,
      unidade: {
        id: row.unidade_id,
        nome: row.unidade_nome
      },
      especialidade: {
        id: row.especialidade_id,
        nome: row.especialidade_nome
      },
      prestador: {
        id: row.prestador_id,
        nome: row.prestador_nome,
        cpf: row.prestador_cpf,
        celular: row.prestador_celular
      }
    }));
    return NextResponse.json({
      data: alocacoesFormatadas,
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
    const validatedData = createAlocacaoSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }
    const { ...payload } = validatedData.data;
    const result = await executeWithRetry(accessPool,
      `INSERT INTO alocacoes (
        unidade_id, especialidade_id, prestador_id
      ) VALUES (?, ?, ?)`,
      [
        payload.unidade_id, payload.especialidade_id, payload.prestador_id
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