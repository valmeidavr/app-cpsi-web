import { NextRequest, NextResponse } from "next/server";
import { accessPool } from "@/lib/mysql";
import { z } from "zod";
import { createUsuarioSchema } from "../schema/formSchemaUsuarios";
import bcrypt from 'bcrypt';
export type CreateUsuarioDTO = z.infer<typeof createUsuarioSchema>;
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createUsuarioSchema.parse(body);
    const [existingUser] = await accessPool.execute(
      'SELECT login FROM usuarios WHERE email = ?',
      [validatedData.email]
    );
    if ((existingUser as Array<{ login: string }>).length > 0) {
      return NextResponse.json(
        { error: 'Usuário já existe com este email' },
        { status: 400 }
      );
    }
    const hashedPassword = await bcrypt.hash(validatedData.senha, 10);
    const generateFriendlyLogin = (nome: string, email: string): string => {
      const nomeParts = nome.trim().toLowerCase().split(' ').filter(part => part.length > 0);
      const primeiroNome = nomeParts[0] || 'user';
      const emailNumbers = email.replace(/[^0-9]/g, '');
      const numbers = emailNumbers ? emailNumbers.substring(0, 3) : Math.floor(Math.random() * 999).toString().padStart(3, '0');
      return primeiroNome + numbers;
    };
    let userLogin = generateFriendlyLogin(validatedData.nome, validatedData.email);
    let loginExists = true;
    let counter = 1;
    while (loginExists) {
      const [existingLogin] = await accessPool.execute(
        'SELECT login FROM usuarios WHERE login = ?',
        [userLogin]
      );
      if ((existingLogin as Array<{ login: string }>).length === 0) {
        loginExists = false;
      } else {
        userLogin = generateFriendlyLogin(validatedData.nome, validatedData.email) + counter.toString();
        counter++;
      }
    }
    await accessPool.execute(
      'INSERT INTO usuarios (login, nome, email, senha, status) VALUES (?, ?, ?, ?, ?)',
      [userLogin, validatedData.nome, validatedData.email, hashedPassword, 'Ativo']
    );
    return NextResponse.json({ 
      success: true, 
      id: userLogin,
      login: userLogin
    });
  } catch (error) {
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