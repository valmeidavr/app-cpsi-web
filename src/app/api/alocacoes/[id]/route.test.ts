import { GET, PUT, DELETE } from './route';
import { NextRequest, NextResponse } from 'next/server';
import { gestorPool, executeWithRetry } from '@/lib/mysql';
import { z } from 'zod';

// Mock the entire @/lib/mysql module
jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
  executeWithRetry: jest.fn((pool, query, params) => {
    // Simulate executeWithRetry calling the mocked gestorPool.execute
    return pool.execute(query, params);
  }),
}));

// Mock the updateAlocacaoSchema from the parent directory
jest.mock('../shema/formSchemaAlocacao', () => ({
  updateAlocacaoSchema: {
    safeParse: jest.fn().mockReturnValue({ success: true, data: {} }),
  },
}));

describe('API /api/alocacoes/[id]', () => {
  const mockId = '1';

  beforeEach(() => {
    // Reset mocks before each test
    (gestorPool.execute as jest.Mock).mockReset();
    (executeWithRetry as jest.Mock).mockReset();
  });

  describe('GET /api/alocacoes/[id]', () => {
    it('should return alocacao for a valid ID', async () => {
      const mockAlocacao = { id: 1, unidade_id: 1, especialidade_id: 1, prestador_id: 1 };
      (executeWithRetry as jest.Mock).mockResolvedValueOnce([mockAlocacao]);

      const request = new NextRequest(`http://localhost/api/alocacoes/${mockId}`);
      const response = await GET(request, { params: Promise.resolve({ id: mockId }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual(mockAlocacao);
      expect(executeWithRetry).toHaveBeenCalledWith(
        gestorPool,
        'SELECT * FROM alocacoes WHERE id = ?',
        ['1']
      );
    });

    it('should return 404 if alocacao is not found', async () => {
      (executeWithRetry as jest.Mock).mockResolvedValueOnce([]); // No alocacao found

      const request = new NextRequest(`http://localhost/api/alocacoes/999`);
      const response = await GET(request, { params: Promise.resolve({ id: '999' }) });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data).toEqual({ error: 'Alocação não encontrada' });
    });

    it('should handle errors gracefully for GET', async () => {
      const errorMessage = 'Database error on GET alocacao';
      (executeWithRetry as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const request = new NextRequest(`http://localhost/api/alocacoes/${mockId}`);
      const response = await GET(request, { params: Promise.resolve({ id: mockId }) });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Erro interno do servidor' });
    });
  });

  describe('PUT /api/alocacoes/[id]', () => {
    it('should update alocacao successfully', async () => {
      const mockUpdateData = {
        unidade_id: 2,
        especialidade_id: 3,
        prestador_id: 4,
      };
      (executeWithRetry as jest.Mock).mockResolvedValueOnce([{}]); // Mock successful update

      const request = new NextRequest(`http://localhost/api/alocacoes/${mockId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockUpdateData),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: mockId }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true });

      expect(executeWithRetry).toHaveBeenCalledWith(
        gestorPool,
        'UPDATE alocacoes SET unidade_id = ?, especialidade_id = ?, prestador_id = ? WHERE id = ?',
        [
          mockUpdateData.unidade_id,
          mockUpdateData.especialidade_id,
          mockUpdateData.prestador_id,
          mockId,
        ]
      );
    });

    it('should return 400 for invalid update data', async () => {
      const invalidData = {
        unidade_id: 'abc', // Invalid type
      };
      const request = new NextRequest(`http://localhost/api/alocacoes/${mockId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidData),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: mockId }) });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Dados inválidos');
      expect(data.details.fieldErrors.unidade_id).toBeDefined();
    });

    it('should handle errors gracefully for PUT', async () => {
      const errorMessage = 'Database error on PUT alocacao';
      (executeWithRetry as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const mockUpdateData = { unidade_id: 2, especialidade_id: 3, prestador_id: 4 };
      const request = new NextRequest(`http://localhost/api/alocacoes/${mockId}`, {
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

  describe('DELETE /api/alocacoes/[id]', () => {
    it('should delete an alocacao successfully', async () => {
      (executeWithRetry as jest.Mock).mockResolvedValueOnce([{}]); // Mock successful delete

      const request = new NextRequest(`http://localhost/api/alocacoes/${mockId}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: mockId }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toEqual({ success: true });
      expect(executeWithRetry).toHaveBeenCalledWith(
        gestorPool,
        'DELETE FROM alocacoes WHERE id = ?',
        ['1']
      );
    });

    it('should handle errors gracefully for DELETE', async () => {
      const errorMessage = 'Database error on DELETE alocacao';
      (executeWithRetry as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));

      const request = new NextRequest(`http://localhost/api/alocacoes/${mockId}`, {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: mockId }) });

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: 'Erro interno do servidor' });
    });
  });
});
