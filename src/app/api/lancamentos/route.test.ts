
import { GET, POST, PUT, DELETE } from './route';
import { NextRequest } from 'next/server';
import { gestorPool, executeWithRetry } from '@/lib/mysql';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
  executeWithRetry: jest.fn(),
}));

describe('API /api/lancamentos', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return a list of lancamentos with pagination', async () => {
      const mockLancamentos = [
        { id: 1, descricao: 'Lancamento 1', valor: 100, usuario_id: '1' },
        { id: 2, descricao: 'Lancamento 2', valor: 200, usuario_id: '2' },
      ];
      const mockTotal = 2;

      (executeWithRetry as jest.Mock)
        .mockResolvedValueOnce(mockLancamentos)
        .mockResolvedValueOnce([{ total: mockTotal }]);
      
      (gestorPool.execute as jest.Mock)
        .mockResolvedValueOnce([[{ nome: 'Usuario 1' }]])
        .mockResolvedValueOnce([[{ nome: 'Usuario 2' }]]);

      const request = new NextRequest('http://localhost/api/lancamentos?page=1&limit=10');
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toHaveLength(2);
      expect(body.pagination).toEqual({
        page: 1,
        limit: 10,
        total: mockTotal,
        totalPages: 1,
      });
    });
  });

  describe('POST', () => {
    it('should create a new lancamento', async () => {
      const mockLancamento = {
        valor: 'R$ 123,45',
        descricao: 'Novo Lancamento',
        data_lancamento: '2023-10-06',
        tipo: 'ENTRADA',
        plano_conta_id: 1,
        caixa_id: 1,
        usuario_id: '1',
      };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([[{ login: '1', nome: 'Usuario 1' }]]);
      (executeWithRetry as jest.Mock).mockResolvedValueOnce({ insertId: 3 });

      const request = new NextRequest('http://localhost/api/lancamentos', {
        method: 'POST',
        body: JSON.stringify(mockLancamento),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true, id: 3 });
    });
  });

  describe('PUT', () => {
    it('should update a lancamento', async () => {
        const mockLancamento = {
            valor: 200,
            descricao: 'Lancamento Atualizado',
          };

      (executeWithRetry as jest.Mock).mockResolvedValueOnce([{}]);

      const request = new NextRequest('http://localhost/api/lancamentos?id=1', {
        method: 'PUT',
        body: JSON.stringify(mockLancamento),
      });

      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });

  describe('DELETE', () => {
    it('should soft delete a lancamento', async () => {
      (executeWithRetry as jest.Mock).mockResolvedValueOnce([{}]);

      const request = new NextRequest('http://localhost/api/lancamentos?id=1', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});
