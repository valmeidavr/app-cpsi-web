import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";
import { z } from "zod";
import { updateUsuarioSchema } from "../../schema/formShemaUpdateUsuario";
import bcrypt from 'bcrypt';
export type UpdateUsuarioDTO = z.infer<typeof updateUsuarioSchema>;
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [rows] = await accessPool.execute(
      'SELECT login, nome, email, status FROM usuarios WHERE login = ? AND status = "Ativo"',
      [id]
    );
    const usuarios = rows as Array<{
      login: string;
      nome: string;
      email: string;
      status: string;
    }>;
    const usuario = usuarios[0];
    if (!usuario) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    const [grupoRows] = await accessPool.execute(
      `SELECT grupo_id as id, 
              CASE grupo_id 
                WHEN 1 THEN 'Administrador' 
                WHEN 2 THEN 'Gestor' 
                WHEN 3 THEN 'Usuário' 
                WHEN 4 THEN 'Operador' 
                ELSE CONCAT('Grupo ', grupo_id) 
              END as nome
       FROM usuariogrupo 
       WHERE usuario_login = ?`,
      [id]
    );
    return NextResponse.json({
      ...usuario,
      sistemas: grupoRows
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateUsuarioSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }
    const { ...payload } = validatedData.data;
    let query = 'UPDATE usuarios SET ';
    const queryParams: (string | number)[] = [];
    if (payload.nome) {
      query += 'nome = ?, ';
      queryParams.push(payload.nome);
    }
    if (payload.email) {
      query += 'email = ?, ';
      queryParams.push(payload.email);
    }
    if (payload.senha) {
      const hashedPassword = await bcrypt.hash(payload.senha, 10);
      query += 'senha = ?, ';
      queryParams.push(hashedPassword);
    }
    query = query.slice(0, -2) + ' WHERE login = ?';
    queryParams.push(id);
    await accessPool.execute(query, queryParams);
    if (validatedData.data.grupos && validatedData.data.grupos.length > 0) {
      await accessPool.execute(
        'DELETE FROM usuariogrupo WHERE usuario_login = ?',
        [id]
      );
      for (const grupoId of validatedData.data.grupos) {
        await accessPool.execute(
          'INSERT INTO usuariogrupo (usuario_login, grupo_id) VALUES (?, ?)',
          [id, grupoId]
        );
      }
    }
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
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await accessPool.execute(
      'UPDATE usuarios SET status = "Inativo" WHERE login = ?',
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