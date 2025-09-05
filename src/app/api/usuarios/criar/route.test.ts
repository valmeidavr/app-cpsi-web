import { POST } from './route';
import { NextRequest, NextResponse } from 'next/server';
import { gestorPool } from '@/lib/mysql';
import bcrypt from 'bcrypt';
import { z } from 'zod'; // Import z for ZodError

// Mock the entire @/lib/mysql module
jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn((password) => Promise.resolve(`hashed_${password}`)),
}));

// Mock the createUsuarioSchema from the parent directory
jest.mock('../schema/formSchemaUsuarios', () => ({
  createUsuarioSchema: {
    safeParse: jest.fn().mockReturnValue({ success: true, data: {} }),
  },
}));

describe('POST /api/usuarios/criar', () => {
  beforeEach(() => {
    // Reset mocks before each test
    (gestorPool.execute as jest.Mock).mockReset();
    (bcrypt.hash as jest.Mock).mockClear();
  });

  it('should create a new user successfully with valid data', async () => {
    const mockUserData = {
      nome: 'Novo Usuário',
      email: 'novo.usuario@example.com',
      senha: 'password123',
    };

    // Mock gestorPool.execute: first for existing user check (return empty), then for insert
    (gestorPool.execute as jest.Mock)
      .mockResolvedValueOnce([[]]) // User does not exist
      .mockResolvedValueOnce([{}]); // Successful insert

    const request = new NextRequest('http://localhost/api/usuarios/criar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockUserData),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.id).toBeDefined(); // Check if a login ID was generated

    expect(gestorPool.execute).toHaveBeenCalledTimes(2);
    expect(gestorPool.execute).toHaveBeenCalledWith(
      'SELECT login FROM usuarios WHERE email = ?',
      [mockUserData.email]
    );
    expect(bcrypt.hash).toHaveBeenCalledWith(mockUserData.senha, 10);
    expect(gestorPool.execute).toHaveBeenCalledWith(
      'INSERT INTO usuarios (login, nome, email, senha, status) VALUES (?, ?, ?, ?, ?)',
      expect.arrayContaining([
        expect.any(String), // Generated userLogin
        mockUserData.nome,
        mockUserData.email,
        `hashed_${mockUserData.senha}`, // Hashed password
        'Ativo',
      ])
    );
  });

  it('should return 400 if user already exists with the email', async () => {
    const mockUserData = {
      nome: 'Existing User',
      email: 'existing.user@example.com',
      senha: 'password123',
    };

    // Mock gestorPool.execute to return an existing user
    (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{ login: 'existing.user@example.com' }]);

    const request = new NextRequest('http://localhost/api/usuarios/criar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockUserData),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toEqual({ error: 'Usuário já existe com este email' });
    expect(gestorPool.execute).toHaveBeenCalledTimes(1); // Only the SELECT query
    expect(bcrypt.hash).not.toHaveBeenCalled(); // Password should not be hashed
  });

  it('should return 400 for invalid data (validation errors)', async () => {
    const invalidData = {
      nome: 'Short', // Too short
      email: 'invalid-email', // Invalid format
      senha: '123', // Too short
    };

    const request = new NextRequest('http://localhost/api/usuarios/criar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidData),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Dados inválidos');
    expect(data.details).toBeDefined();
    expect(data.details[0].path).toEqual(['nome']);
    expect(data.details[1].path).toEqual(['email']);
    expect(data.details[2].path).toEqual(['senha']);
    expect(gestorPool.execute).not.toHaveBeenCalled(); // No database interaction
    expect(bcrypt.hash).not.toHaveBeenCalled(); // No password hashing
  });

  it('should handle internal server errors gracefully', async () => {
    const mockUserData = {
      nome: 'Error User',
      email: 'error.user@example.com',
      senha: 'password123',
    };

    // Mock gestorPool.execute to throw an error during the existing user check
    (gestorPool.execute as jest.Mock).mockRejectedValueOnce(new Error('Database connection failed'));

    const request = new NextRequest('http://localhost/api/usuarios/criar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockUserData),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data).toEqual({ error: 'Erro interno do servidor' });
    expect(gestorPool.execute).toHaveBeenCalledTimes(1); // Only the SELECT query
    expect(bcrypt.hash).not.toHaveBeenCalled(); // No password hashing
  });
});
