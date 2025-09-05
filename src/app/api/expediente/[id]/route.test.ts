
import { GET, PUT } from './route';
import { NextRequest } from 'next/server';
import { gestorPool } from '@/lib/mysql';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

describe('API /api/expediente/[id]', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return an expediente by id', async () => {
      const mockExpediente = { id: 1, dt_inicio: '2023-01-01', dt_final: '2023-01-31' };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([[mockExpediente]]);

      const request = new NextRequest('http://localhost/api/expediente/1');
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockExpediente);
    });

    it('should return 404 if expediente not found', async () => {
        (gestorPool.execute as jest.Mock).mockResolvedValueOnce([[]]);
  
        const request = new NextRequest('http://localhost/api/expediente/1');
        const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
        const body = await response.json();
  
        expect(response.status).toBe(404);
        expect(body.error).toBe('Expediente não encontrado');
      });
  });

  describe('PUT', () => {
    it('should update an expediente', async () => {
      const mockExpediente = {
        dt_inicio: '2023-02-01',
        dt_final: '2023-02-28',
      };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]);

      const request = new NextRequest('http://localhost/api/expediente/1', {
        method: 'PUT',
        body: JSON.stringify(mockExpediente),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});
