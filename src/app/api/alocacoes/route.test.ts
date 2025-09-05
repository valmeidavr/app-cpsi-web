
import { GET, POST } from './route';
import { NextRequest } from 'next/server';
import { gestorPool, executeWithRetry } from '@/lib/mysql';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
  executeWithRetry: jest.fn(),
}));

describe('API /api/alocacoes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return a list of alocacoes with pagination', async () => {
      const mockAlocacoes = [
        { id: 1, unidade_id: 1, especialidade_id: 1, prestador_id: 1 },
        { id: 2, unidade_id: 2, especialidade_id: 2, prestador_id: 2 },
      ];
      const mockTotal = 2;

      (executeWithRetry as jest.Mock)
        .mockResolvedValueOnce(mockAlocacoes)
        .mockResolvedValueOnce([{ total: mockTotal }]);

      const request = new NextRequest('http://localhost/api/alocacoes?page=1&limit=10');
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toEqual(mockAlocacoes.map(m => ({...m, especialidade: {id: m.especialidade_id}, prestador: {id: m.prestador_id}, unidade: {id: m.unidade_id}})));
      expect(body.pagination).toEqual({
        page: 1,
        limit: 10,
        total: mockTotal,
        totalPages: 1,
      });
    });
  });

  describe('POST', () => {
    it('should create a new alocacao', async () => {
      const mockAlocacao = {
        unidade_id: 3,
        especialidade_id: 3,
        prestador_id: 3,
      };

      (executeWithRetry as jest.Mock).mockResolvedValueOnce({ insertId: 3 });

      const request = new NextRequest('http://localhost/api/alocacoes', {
        method: 'POST',
        body: JSON.stringify(mockAlocacao),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true, id: 3 });
    });
  });
});
