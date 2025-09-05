
import { GET, PUT } from './route';
import { NextRequest } from 'next/server';
import { gestorPool } from '@/lib/mysql';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

describe('API /api/prestadores/[id]', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return a prestador by id', async () => {
      const mockPrestador = { id: 1, nome: 'Prestador A', cpf: '12345678900' };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([[mockPrestador]]);

      const request = new NextRequest('http://localhost/api/prestadores/1');
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockPrestador);
    });

    it('should return 404 if prestador not found', async () => {
        (gestorPool.execute as jest.Mock).mockResolvedValueOnce([[]]);
  
        const request = new NextRequest('http://localhost/api/prestadores/1');
        const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
        const body = await response.json();
  
        expect(response.status).toBe(404);
        expect(body.error).toBe('Prestador não encontrado');
      });
  });

  describe('PUT', () => {
    it('should update a prestador', async () => {
      const mockPrestador = {
        nome: 'Prestador Atualizado',
        cpf: '00987654321',
      };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]);

      const request = new NextRequest('http://localhost/api/prestadores/1', {
        method: 'PUT',
        body: JSON.stringify(mockPrestador),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});
