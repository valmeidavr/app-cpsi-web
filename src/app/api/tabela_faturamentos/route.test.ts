import { GET, POST } from './route';
import { NextRequest } from 'next/server';
import { gestorPool } from '@/lib/mysql';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

describe('API /api/tabela_faturamentos', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return a list of tabela_faturamentos with pagination', async () => {
      const mockTabelaFaturamentos = [
        { id: 1, nome: 'Tabela A' },
        { id: 2, nome: 'Tabela B' },
      ];
      const mockTotal = 2;

      (gestorPool.execute as jest.Mock)
        .mockResolvedValueOnce([mockTabelaFaturamentos]) // for the data
        .mockResolvedValueOnce([[{ total: mockTotal }]]); // for the count

      const request = new NextRequest('http://localhost/api/tabela_faturamentos?page=1&limit=10');
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toEqual(mockTabelaFaturamentos);
      expect(body.pagination).toEqual({
        page: 1,
        limit: 10,
        total: mockTotal,
        totalPages: 1,
      });
    });
  });

  describe('POST', () => {
    it('should create a new tabela_faturamento', async () => {
      const mockTabelaFaturamento = {
        nome: 'Nova Tabela',
      };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{ insertId: 3 }]);

      const request = new NextRequest('http://localhost/api/tabela_faturamentos', {
        method: 'POST',
        body: JSON.stringify(mockTabelaFaturamento),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true, id: 3 });
    });
  });
});