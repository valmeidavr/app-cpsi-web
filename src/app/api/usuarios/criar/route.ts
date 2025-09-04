import { NextRequest, NextResponse } from "next/server";
import { gestorPool } from "@/lib/mysql";
import { z } from "zod";
import { createUsuarioSchema } from "../schema/formSchemaUsuarios";
import bcrypt from 'bcrypt';

export type CreateUsuarioDTO = z.infer<typeof createUsuarioSchema>;

// API route para POST (criar usuário)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createUsuarioSchema.parse(body);
    
    // Verificar se o usuário já existe
    const [existingUser] = await gestorPool.execute(
      'SELECT login FROM usuarios WHERE email = ?',
      [validatedData.email]
    );
    
    if ((existingUser as Array<{ login: string }>).length > 0) {
      return NextResponse.json(
        { error: 'Usuário já existe com este email' },
        { status: 400 }
      );
    }
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(validatedData.senha, 10);
    
    // Gerar login único (usando timestamp + random)
    const userLogin = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    
    // Inserir usuário
    await gestorPool.execute(
      'INSERT INTO usuarios (login, nome, email, senha, status) VALUES (?, ?, ?, ?, ?)',
      [userLogin, validatedData.nome, validatedData.email, hashedPassword, 'Ativo']
    );
    
    return NextResponse.json({ 
      success: true, 
      id: userLogin 
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 