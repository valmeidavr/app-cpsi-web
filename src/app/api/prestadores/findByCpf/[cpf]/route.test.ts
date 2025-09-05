
import { GET } from './route';
import { NextRequest } from 'next/server';
import { gestorPool } from '@/lib/mysql';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

describe('API /api/prestadores/findByCpf/[cpf]', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return true if prestador with cpf exists', async () => {
      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([[{ id: 1 }]]);

      const request = new NextRequest('http://localhost/api/prestadores/findByCpf/12345678900');
      const response = await GET(request, { params: Promise.resolve({ cpf: '12345678900' }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toBe(true);
    });

    it('should return false if prestador with cpf does not exist', async () => {
        (gestorPool.execute as jest.Mock).mockResolvedValueOnce([[]]);
  
        const request = new NextRequest('http://localhost/api/prestadores/findByCpf/12345678900');
        const response = await GET(request, { params: Promise.resolve({ cpf: '12345678900' }) });
        const body = await response.json();
  
        expect(response.status).toBe(200);
        expect(body).toBe(false);
      });
  });
});
