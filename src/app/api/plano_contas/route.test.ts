
import { GET, POST } from './route';
import { NextRequest } from 'next/server';
import { gestorPool } from '@/lib/mysql';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

describe('API /api/plano_contas', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return a list of plano_contas with pagination', async () => {
      const mockPlanoContas = [
        { id: 1, nome: 'Plano A', categoria: 'Categoria A' },
        { id: 2, nome: 'Plano B', categoria: 'Categoria B' },
      ];
      const mockTotal = 2;

      (gestorPool.execute as jest.Mock)
        .mockResolvedValueOnce([mockPlanoContas]) // for the data
        .mockResolvedValueOnce([[{ total: mockTotal }]]); // for the count

      const request = new NextRequest('http://localhost/api/plano_contas?page=1&limit=10');
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toEqual(mockPlanoContas);
      expect(body.pagination).toEqual({
        page: 1,
        limit: 10,
        total: mockTotal,
        totalPages: 1,
      });
    });
  });

  describe('POST', () => {
    it('should create a new plano_conta', async () => {
      const mockPlanoConta = {
        nome: 'Novo Plano',
        tipo: 'Tipo C',
        categoria: 'Categoria C',
        descricao: 'Descricao C',
      };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{ insertId: 3 }]);

      const request = new NextRequest('http://localhost/api/plano_contas', {
        method: 'POST',
        body: JSON.stringify(mockPlanoConta),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true, id: 3 });
    });
  });
});
