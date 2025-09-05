
import { GET } from './route';
import { NextRequest } from 'next/server';
import { gestorPool } from '@/lib/mysql';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

describe('API /api/clientes/findByEmail/[email]', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return true if client with email exists', async () => {
      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([[{ id: 1 }]]);

      const request = new NextRequest('http://localhost/api/clientes/findByEmail/test@example.com');
      const response = await GET(request, { params: Promise.resolve({ email: 'test@example.com' }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toBe(true);
    });

    it('should return false if client with email does not exist', async () => {
        (gestorPool.execute as jest.Mock).mockResolvedValueOnce([[]]);
  
        const request = new NextRequest('http://localhost/api/clientes/findByEmail/test@example.com');
        const response = await GET(request, { params: Promise.resolve({ email: 'test@example.com' }) });
        const body = await response.json();
  
        expect(response.status).toBe(200);
        expect(body).toBe(false);
      });
  });
});
