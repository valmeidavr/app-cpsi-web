
import { GET } from './route';
import { NextRequest } from 'next/server';
import { gestorPool } from '@/lib/mysql';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

describe('API /api/clientes/findByCpf/[cpf]', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return clients with the given cpf', async () => {
      const mockClients = [{ id: 1, nome: 'Cliente A', cpf: '12345678900' }];

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([mockClients]);

      const request = new NextRequest('http://localhost/api/clientes/findByCpf/12345678900');
      const response = await GET(request, { params: Promise.resolve({ cpf: '12345678900' }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockClients);
    });

    it('should return empty array if no client with cpf is found', async () => {
        (gestorPool.execute as jest.Mock).mockResolvedValueOnce([[]]);
  
        const request = new NextRequest('http://localhost/api/clientes/findByCpf/12345678900');
        const response = await GET(request, { params: Promise.resolve({ cpf: '12345678900' }) });
        const body = await response.json();
  
        expect(response.status).toBe(200);
        expect(body).toEqual([]);
      });
  });
});
