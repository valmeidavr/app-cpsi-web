import { GET, PUT, DELETE } from './route';
import { NextRequest } from 'next/server';
import { gestorPool } from '@/lib/mysql';
import { updateTabelaFaturamentoSchema } from '../schema/formSchemaEspecialidade';
import { z } from 'zod';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

jest.mock('../schema/formSchemaEspecialidade', () => ({
    updateTabelaFaturamentoSchema: {
        safeParse: jest.fn().mockReturnValue({ success: true, data: {} }),
    }
}));

describe('API /api/tabela_faturamentos/[id]', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return a tabela_faturamento by id', async () => {
      const mockTabela = { id: 1, nome: 'Tabela A' };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([[mockTabela]]);

      const request = new NextRequest('http://localhost/api/tabela_faturamentos/1');
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockTabela);
    });

    it('should return 404 if tabela_faturamento not found', async () => {
        (gestorPool.execute as jest.Mock).mockResolvedValueOnce([[]]);
  
        const request = new NextRequest('http://localhost/api/tabela_faturamentos/1');
        const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
        const body = await response.json();
  
        expect(response.status).toBe(404);
        expect(body.error).toBe('Tabela de faturamento não encontrada');
      });
  });

  describe('PUT', () => {
    it('should update a tabela_faturamento', async () => {
      const mockTabela = {
        nome: 'Tabela Atualizada',
      };

      (updateTabelaFaturamentoSchema.safeParse as jest.Mock).mockReturnValue({ success: true, data: mockTabela });
      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]);

      const request = new NextRequest('http://localhost/api/tabela_faturamentos/1', {
        method: 'PUT',
        body: JSON.stringify(mockTabela),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });

  describe('DELETE', () => {
    it('should soft delete a tabela_faturamento', async () => {
      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]);

      const request = new NextRequest('http://localhost/api/tabela_faturamentos/1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});