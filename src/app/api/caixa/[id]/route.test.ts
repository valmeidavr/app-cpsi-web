import { GET, PUT, DELETE } from './route';
import { NextRequest } from 'next/server';
import { gestorPool } from '@/lib/mysql';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

describe('API /api/caixa/[id]', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return a caixa by id', async () => {
      const mockCaixa = { id: 1, nome: 'Caixa A', tipo: 'Tipo A', saldo: 100 };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([[mockCaixa]]);

      const request = new NextRequest('http://localhost/api/caixa/1');
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockCaixa);
    });

    it('should return 404 if caixa not found', async () => {
        (gestorPool.execute as jest.Mock).mockResolvedValueOnce([[]]);
  
        const request = new NextRequest('http://localhost/api/caixa/1');
        const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
        const body = await response.json();
  
        expect(response.status).toBe(404);
        expect(body.error).toBe('Caixa não encontrado');
      });
  });

  describe('PUT', () => {
    it('should update a caixa', async () => {
      const mockCaixa = {
        nome: 'Caixa Atualizado',
        tipo: 'Tipo B',
        saldo: 200,
      };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]);

      const request = new NextRequest('http://localhost/api/caixa/1', {
        method: 'PUT',
        body: JSON.stringify(mockCaixa),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });

  describe('DELETE', () => {
    it('should soft delete a caixa', async () => {
      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]);

      const request = new NextRequest('http://localhost/api/caixa/1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: '1' }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});