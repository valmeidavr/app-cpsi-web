import { GET, PUT } from './route';
import { NextRequest, NextResponse } from 'next/server';
import { gestorPool } from '@/lib/mysql';
import { z } from 'zod'; // Import z for ZodError

// Mock the entire @/lib/mysql module
jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

// Mock the updateUsuarioSchema from the parent directory
// This is a simplified mock, in a real scenario you might want to import the actual schema
// and use its parse/safeParse methods directly, or mock its behavior more accurately.
jest.mock('../schema/formShemaUpdateUsuario', () => ({
  updateUsuarioSchema: {
    safeParse: jest.fn().mockImplementation((data) => ({ 
      success: true, 
      data: data 
    })),
  },
}));

describe('API /api/usuarios/perfil', () => {
  beforeEach(() => {
    // Reset mocks before each test
    (gestorPool.execute as jest.Mock).mockReset();
  });

  describe('GET /api/usuarios/perfil', () => {
    it('should return user data for a valid ID', async () => {
      const mockUser = { id: 1, nome: 'Test User', email: 'test@example.com', status: 'Ativo' };
      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([[mockUser]]);

      const request = new NextRequest('http://localhost/api/usuarios/perfil?id=1');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockUser);
      expect(gestorPool.execute).toHaveBeenCalledWith(
        'SELECT id, nome, email, status FROM usuarios WHERE id = ? AND status = "Ativo"',
        ['1']
      );
    });

    it('should return 404 if user is not found', async () => {
      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([[]]); // No user found

      const request = new NextRequest('http://localhost/api/usuarios/perfil?id=999');
      const response = await GET(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: 'Usuário não encontrado' });
    });

    it('should return 400 if ID is missing', async () => {
      const request = new NextRequest('http://localhost/api/usuarios/perfil'); // No ID param
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: 'ID é obrigatório' });
    });

    it('should handle errors gracefully for GET', async () => {
      const errorMessage = 'Database error on GET user profile';
      (gestorPool.execute as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const request = new NextRequest('http://localhost/api/usuarios/perfil?id=1');
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Erro interno do servidor' });
    });
  });

  describe('PUT /api/usuarios/perfil', () => {
    it('should update user profile successfully', async () => {
      const mockUpdateData = {
        nome: 'Updated Name',
        email: 'updated.email@example.com',
      };
      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]); // Mock successful update

      const request = new NextRequest('http://localhost/api/usuarios/perfil?id=1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUpdateData),
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true });
      expect(gestorPool.execute).toHaveBeenCalledWith(
        'UPDATE usuarios SET nome = ?, email = ? WHERE id = ?',
        ['Updated Name', 'updated.email@example.com', '1']
      );
    });

    it('should return 400 if ID is missing for PUT', async () => {
      const mockUpdateData = { nome: 'Updated Name' };
      const request = new NextRequest('http://localhost/api/usuarios/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUpdateData),
      });

      const response = await PUT(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: 'ID é obrigatório' });
    });

    it('should return 400 for invalid update data', async () => {
      const invalidData = {
        email: 'invalid-email-format', // Invalid email
      };
      const request = new NextRequest('http://localhost/api/usuarios/perfil?id=1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      const response = await PUT(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Dados inválidos');
      expect(data.details.fieldErrors.email).toBeDefined();
    });

    it('should handle errors gracefully for PUT', async () => {
      const errorMessage = 'Database error on PUT user profile';
      (gestorPool.execute as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const mockUpdateData = { nome: 'Updated Name' };
      const request = new NextRequest('http://localhost/api/usuarios/perfil?id=1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUpdateData),
      });

      const response = await PUT(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Erro interno do servidor' });
    });
  });
});
