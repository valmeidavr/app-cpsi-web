
import { GET, POST } from './route';
import { NextRequest } from 'next/server';
import { gestorPool, executeWithRetry } from '@/lib/mysql';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
  executeWithRetry: jest.fn(),
}));

describe('API /api/caixa', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return a list of caixas with pagination', async () => {
      const mockCaixas = [
        { id: 1, nome: 'Caixa A', tipo: 'Tipo A', saldo: 100 },
        { id: 2, nome: 'Caixa B', tipo: 'Tipo B', saldo: 200 },
      ];
      const mockTotal = 2;

      (executeWithRetry as jest.Mock)
        .mockResolvedValueOnce(mockCaixas)
        .mockResolvedValueOnce([{ total: mockTotal }]);

      const request = new NextRequest('http://localhost/api/caixa?page=1&limit=10');
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toEqual(mockCaixas);
      expect(body.pagination).toEqual({
        page: 1,
        limit: 10,
        total: mockTotal,
        totalPages: 1,
      });
    });
  });

  describe('POST', () => {
    it('should create a new caixa', async () => {
      const mockCaixa = {
        nome: 'Novo Caixa',
        tipo: 'Tipo C',
        saldo: 'R$ 300,00',
      };

      (executeWithRetry as jest.Mock).mockResolvedValueOnce({ insertId: 3 });

      const request = new NextRequest('http://localhost/api/caixa', {
        method: 'POST',
        body: JSON.stringify(mockCaixa),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true, id: 3 });
      expect(executeWithRetry).toHaveBeenCalledWith(
        expect.any(Object),
        expect.stringContaining('INSERT INTO caixas'),
        ['Novo Caixa', 'Tipo C', 300]
      );
    });
  });
});
