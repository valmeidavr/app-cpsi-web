
import { GET, PUT } from './route';
import { NextRequest } from 'next/server';
import { gestorPool } from '@/lib/mysql';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

describe('API /api/lancamentos/[id]', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return a lancamento by id', async () => {
      const mockLancamento = { id: 1, descricao: 'Lancamento 1', valor: 100 };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([[mockLancamento]]);

      const request = new NextRequest('http://localhost/api/lancamentos/1');
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockLancamento);
    });

    it('should return 404 if lancamento not found', async () => {
        (gestorPool.execute as jest.Mock).mockResolvedValueOnce([[]]);
  
        const request = new NextRequest('http://localhost/api/lancamentos/1');
        const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
        const body = await response.json();
  
        expect(response.status).toBe(404);
        expect(body.error).toBe('Lançamento não encontrado');
      });
  });

  describe('PUT', () => {
    it('should update a lancamento', async () => {
      const mockLancamento = {
        descricao: 'Lancamento Atualizado',
        valor: 200,
      };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]);

      const request = new NextRequest('http://localhost/api/lancamentos/1', {
        method: 'PUT',
        body: JSON.stringify(mockLancamento),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});
