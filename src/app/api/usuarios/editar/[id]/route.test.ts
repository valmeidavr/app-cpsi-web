import { GET, PUT, DELETE } from './route';
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

// Mock the updateUsuarioSchema from the parent directory
jest.mock('../../schema/formShemaUpdateUsuario', () => ({
  updateUsuarioSchema: {
    safeParse: jest.fn().mockImplementation((data) => ({ 
      success: true, 
      data: data 
    })),
  },
}));

describe('API /api/usuarios/editar/[id]', () => {
  const mockUserId = 'testUserLogin';

  beforeEach(() => {
    // Reset mocks before each test
    (gestorPool.execute as jest.Mock).mockReset();
    (bcrypt.hash as jest.Mock).mockClear();
  });

  describe('GET /api/usuarios/editar/[id]', () => {
    it('should return user data and systems for a valid ID', async () => {
      const mockUser = { login: mockUserId, nome: 'Test User', email: 'test@example.com', status: 'Ativo' };
      const mockSystems = [{ id: 1, nome: 'Sistema A', nivel: 'Admin' }];

      (gestorPool.execute as jest.Mock)
        .mockResolvedValueOnce([[mockUser]]) // For SELECT user
        .mockResolvedValueOnce([mockSystems]); // For SELECT user systems

      const request = new NextRequest(`http://localhost/api/usuarios/editar/${mockUserId}`);
      const response = await GET(request, { params: Promise.resolve({ id: mockUserId }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ ...mockUser, sistemas: mockSystems });
      expect(gestorPool.execute).toHaveBeenCalledWith(
        'SELECT login, nome, email, status FROM usuarios WHERE login = ? AND status = "Ativo"',
        ['testUserLogin']
      );
      expect(gestorPool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT s.id, s.nome, us.nivel FROM sistemas s INNER JOIN usuario_sistema us ON s.id = us.sistemas_id WHERE us.usuarios_login = ?'),
        ['testUserLogin']
      );
    });

    it('should return 404 if user is not found for GET', async () => {
      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([[]]); // No user found

      const request = new NextRequest(`http://localhost/api/usuarios/editar/${mockUserId}`);
      const response = await GET(request, { params: Promise.resolve({ id: mockUserId }) });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: 'Usuário não encontrado' });
    });

    it('should handle errors gracefully for GET', async () => {
      const errorMessage = 'Database error on GET user by ID';
      (gestorPool.execute as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const request = new NextRequest(`http://localhost/api/usuarios/editar/${mockUserId}`);
      const response = await GET(request, { params: Promise.resolve({ id: mockUserId }) });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Erro interno do servidor' });
    });
  });

  describe('PUT /api/usuarios/editar/[id]', () => {
    it('should update user name and email successfully', async () => {
      const mockUpdateData = {
        nome: 'Updated Name',
        email: 'updated.email@example.com',
      };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]); // Mock successful update

      const request = new NextRequest(`http://localhost/api/usuarios/editar/${mockUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUpdateData),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: mockUserId }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true });

      expect(gestorPool.execute).toHaveBeenCalledWith(
        'UPDATE usuarios SET nome = ?, email = ? WHERE login = ?',
        ['Updated Name', 'updated.email@example.com', mockUserId]
      );
      expect(bcrypt.hash).not.toHaveBeenCalled(); // Password not updated
    });

    it('should update user password successfully', async () => {
      const mockUpdateData = {
        senha: 'newPassword123',
      };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]); // Mock successful update

      const request = new NextRequest(`http://localhost/api/usuarios/editar/${mockUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUpdateData),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: mockUserId }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true });

      expect(bcrypt.hash).toHaveBeenCalledWith(mockUpdateData.senha, 10);
      expect(gestorPool.execute).toHaveBeenCalledWith(
        'UPDATE usuarios SET senha = ? WHERE login = ?',
        [`hashed_${mockUpdateData.senha}`, mockUserId]
      );
    });

    it('should return 400 for invalid update data', async () => {
      const invalidData = {
        email: 'invalid-email-format', // Invalid email
      };

      const request = new NextRequest(`http://localhost/api/usuarios/editar/${mockUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: mockUserId }) });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Dados inválidos');
      expect(data.details.fieldErrors.email).toBeDefined();
    });

    it('should handle errors gracefully for PUT', async () => {
      const errorMessage = 'Database error on PUT user';
      (gestorPool.execute as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const mockUpdateData = { nome: 'Updated Name' };
      const request = new NextRequest(`http://localhost/api/usuarios/editar/${mockUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUpdateData),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: mockUserId }) });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Erro interno do servidor' });
    });
  });

  describe('DELETE /api/usuarios/editar/[id]', () => {
    it('should soft delete a user successfully', async () => {
      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]); // Mock successful update

      const request = new NextRequest(`http://localhost/api/usuarios/editar/${mockUserId}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: mockUserId }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true });
      expect(gestorPool.execute).toHaveBeenCalledWith(
        'UPDATE usuarios SET status = "Inativo" WHERE login = ?',
        ['testUserLogin']
      );
    });

    it('should handle errors gracefully for DELETE', async () => {
      const errorMessage = 'Database error on DELETE user';
      (gestorPool.execute as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const request = new NextRequest(`http://localhost/api/usuarios/editar/${mockUserId}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: mockUserId }) });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Erro interno do servidor' });
    });
  });
});
