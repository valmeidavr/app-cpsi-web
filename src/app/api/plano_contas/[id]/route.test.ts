import { GET, PUT, DELETE } from './route';
import { NextRequest, NextResponse } from 'next/server';
import { gestorPool } from '@/lib/mysql';
import { z } from 'zod';

// Mock the entire @/lib/mysql module
jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

// Mock the updatePlanosSchema from the parent directory
jest.mock('../schema/formSchemaPlanos', () => ({
  updatePlanosSchema: {
    safeParse: jest.fn().mockReturnValue({ success: true, data: {} }),
  },
}));

describe('API /api/plano_contas/[id]', () => {
  const mockId = '1';

  beforeEach(() => {
    // Reset mocks before each test
    (gestorPool.execute as jest.Mock).mockReset();
  });

  describe('GET /api/plano_contas/[id]', () => {
    it('should return plano de contas for a valid ID', async () => {
      const mockPlano = { id: 1, nome: 'Plano Teste', categoria: 'Receita', status: 'Ativo' };
      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([[mockPlano]]);

      const request = new NextRequest(`http://localhost/api/plano_contas/${mockId}`);
      const response = await GET(request, { params: Promise.resolve({ id: mockId }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockPlano);
      expect(gestorPool.execute).toHaveBeenCalledWith(
        'SELECT * FROM plano_contas WHERE id = ?',
        ['1']
      );
    });

    it('should return 404 if plano de contas is not found', async () => {
      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([[]]); // No plano found

      const request = new NextRequest(`http://localhost/api/plano_contas/999`);
      const response = await GET(request, { params: Promise.resolve({ id: '999' }) });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: 'Plano de contas não encontrado' });
    });

    it('should handle errors gracefully for GET', async () => {
      const errorMessage = 'Database error on GET plano de contas';
      (gestorPool.execute as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const request = new NextRequest(`http://localhost/api/plano_contas/${mockId}`);
      const response = await GET(request, { params: Promise.resolve({ id: mockId }) });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Erro interno do servidor' });
    });
  });

  describe('PUT /api/plano_contas/[id]', () => {
    it('should update plano de contas successfully', async () => {
      const mockUpdateData = {
        nome: 'Plano Atualizado',
        categoria: 'Despesa',
        descricao: 'Nova descrição',
      };
      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]); // Mock successful update

      const request = new NextRequest(`http://localhost/api/plano_contas/${mockId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUpdateData),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: mockId }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true });

      expect(gestorPool.execute).toHaveBeenCalledWith(
        'UPDATE plano_contas SET nome = ?, categoria = ?, descricao = ? WHERE id = ?',
        [mockUpdateData.nome, mockUpdateData.categoria, mockUpdateData.descricao, mockId]
      );
    });

    it('should return 400 for invalid update data', async () => {
      const invalidData = {
        nome: 'ab', // Too short
        categoria: '', // Too short
      };
      const request = new NextRequest(`http://localhost/api/plano_contas/${mockId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: mockId }) });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Dados inválidos');
      expect(data.details.fieldErrors.nome).toBeDefined();
      expect(data.details.fieldErrors.categoria).toBeDefined();
    });

    it('should handle errors gracefully for PUT', async () => {
      const errorMessage = 'Database error on PUT plano de contas';
      (gestorPool.execute as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const mockUpdateData = { nome: 'Plano Atualizado', categoria: 'Receita' };
      const request = new NextRequest(`http://localhost/api/plano_contas/${mockId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUpdateData),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: mockId }) });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Erro interno do servidor' });
    });
  });

  describe('DELETE /api/plano_contas/[id]', () => {
    it('should soft delete a plano de contas successfully', async () => {
      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]); // Mock successful update

      const request = new NextRequest(`http://localhost/api/plano_contas/${mockId}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: mockId }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true });
      expect(gestorPool.execute).toHaveBeenCalledWith(
        'UPDATE plano_contas SET status = "Inativo" WHERE id = ?',
        ['1']
      );
    });

    it('should handle errors gracefully for DELETE', async () => {
      const errorMessage = 'Database error on DELETE plano de contas';
      (gestorPool.execute as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const request = new NextRequest(`http://localhost/api/plano_contas/${mockId}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: mockId }) });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Erro interno do servidor' });
    });
  });
});
