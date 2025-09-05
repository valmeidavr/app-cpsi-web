import { GET, POST, PUT } from './route';
import { NextRequest, NextResponse } from 'next/server';
import { gestorPool } from '@/lib/mysql';

// Mock the entire @/lib/mysql module
jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

describe('API /api/usuarios/sistemas', () => {
  beforeEach(() => {
    // Reset mocks before each test
    (gestorPool.execute as jest.Mock).mockReset();
  });

  describe('GET /api/usuarios/sistemas', () => {
    it('should return all systems successfully', async () => {
      const mockSystems = [
        { id: 1, nome: 'Sistema A' },
        { id: 2, nome: 'Sistema B' },
      ];
      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([mockSystems]);

      const response = await GET(); // GET has no request object

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockSystems);
      expect(gestorPool.execute).toHaveBeenCalledWith('SELECT id, nome FROM sistemas ORDER BY nome');
    });

    it('should handle errors gracefully for GET', async () => {
      const errorMessage = 'Database error on GET systems';
      (gestorPool.execute as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const response = await GET();

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Erro interno do servidor' });
    });
  });

  describe('POST /api/usuarios/sistemas', () => {
    it('should return user access and all systems successfully', async () => {
      const mockSystems = [{ id: 1, nome: 'Sistema A' }, { id: 2, nome: 'Sistema B' }];
      const mockUserAccess = [{ sistemas_id: 1, nivel: 'Admin', sistema_nome: 'Sistema A' }];

      (gestorPool.execute as jest.Mock)
        .mockResolvedValueOnce([mockSystems]) // For SELECT systems
        .mockResolvedValueOnce([mockUserAccess]); // For SELECT user_sistema

      const request = new NextRequest('http://localhost/api/usuarios/sistemas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'testUser' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.sistemas).toEqual(mockSystems);
      expect(data.userAccess).toEqual({
        1: { nivel: 'Admin', sistema_nome: 'Sistema A' },
      });
      expect(gestorPool.execute).toHaveBeenCalledWith('SELECT id, nome FROM sistemas ORDER BY nome');
      expect(gestorPool.execute).toHaveBeenCalledWith(
        expect.stringContaining('SELECT us.sistemas_id, us.nivel, s.nome as sistema_nome FROM usuario_sistema us INNER JOIN sistemas s ON us.sistemas_id = s.id WHERE us.usuarios_login = ?'),
        ['testUser']
      );
    });

    it('should return 400 if userId is missing for POST', async () => {
      const request = new NextRequest('http://localhost/api/usuarios/sistemas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toEqual({ error: 'ID do usuário é obrigatório' });
    });

    it('should handle errors gracefully for POST', async () => {
      const errorMessage = 'Database error on POST user access';
      (gestorPool.execute as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const request = new NextRequest('http://localhost/api/usuarios/sistemas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'testUser' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Erro interno do servidor' });
    });
  });

  describe('PUT /api/usuarios/sistemas', () => {
    it('should update user access successfully', async () => {
      const mockSistemasUpdate = [
        { id: 1, hasAccess: true, nivel: 'Usuario' },
        { id: 2, hasAccess: false }, // No insert for this one
        { id: 3, hasAccess: true, nivel: 'Admin' },
      ];

      // Mock DELETE and INSERT operations
      (gestorPool.execute as jest.Mock)
        .mockResolvedValueOnce([{}]) // For DELETE
        .mockResolvedValueOnce([{}]) // For first INSERT
        .mockResolvedValueOnce([{}]); // For second INSERT

      const request = new NextRequest('http://localhost/api/usuarios/sistemas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'testUser', sistemas: mockSistemasUpdate }),
      });

      const response = await PUT(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true });

      expect(gestorPool.execute).toHaveBeenCalledWith(
        'DELETE FROM usuario_sistema WHERE usuarios_login = ?',
        ['testUser']
      );
      expect(gestorPool.execute).toHaveBeenCalledWith(
        'INSERT INTO usuario_sistema (usuarios_login, sistemas_id, nivel) VALUES (?, ?, ?)',
        ['testUser', 1, 'Usuario']
      );
      expect(gestorPool.execute).toHaveBeenCalledWith(
        'INSERT INTO usuario_sistema (usuarios_login, sistemas_id, nivel) VALUES (?, ?, ?)',
        ['testUser', 3, 'Admin']
      );
      expect(gestorPool.execute).toHaveBeenCalledTimes(3); // DELETE + 2 INSERTS
    });

    it('should return 400 if userId or sistemas are missing for PUT', async () => {
      const requestMissingUserId = new NextRequest('http://localhost/api/usuarios/sistemas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sistemas: [] }),
      });
      let response = await PUT(requestMissingUserId);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Dados obrigatórios não fornecidos' });

      const requestMissingSistemas = new NextRequest('http://localhost/api/usuarios/sistemas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'testUser' }),
      });
      response = await PUT(requestMissingSistemas);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Dados obrigatórios não fornecidos' });
    });

    it('should handle errors gracefully for PUT', async () => {
      const errorMessage = 'Database error on PUT user access';
      (gestorPool.execute as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const request = new NextRequest('http://localhost/api/usuarios/sistemas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'testUser', sistemas: [{ id: 1, hasAccess: true, nivel: 'Usuario' }] }),
      });

      const response = await PUT(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Erro interno do servidor' });
    });
  });
});
