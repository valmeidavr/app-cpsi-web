
import { GET, PUT } from './route';
import { NextRequest } from 'next/server';
import { gestorPool } from '@/lib/mysql';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

describe('API /api/unidades/[id]', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return a unidade by id', async () => {
      const mockUnidade = { id: 1, nome: 'Unidade A' };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([[mockUnidade]]);

      const request = new NextRequest('http://localhost/api/unidades/1');
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockUnidade);
    });

    it('should return 404 if unidade not found', async () => {
        (gestorPool.execute as jest.Mock).mockResolvedValueOnce([[]]);
  
        const request = new NextRequest('http://localhost/api/unidades/1');
        const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
        const body = await response.json();
  
        expect(response.status).toBe(404);
        expect(body.error).toBe('Unidade não encontrada');
      });
  });

  describe('PUT', () => {
    it('should update a unidade', async () => {
      const mockUnidade = {
        nome: 'Unidade Atualizada',
      };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]);

      const request = new NextRequest('http://localhost/api/unidades/1', {
        method: 'PUT',
        body: JSON.stringify(mockUnidade),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});
