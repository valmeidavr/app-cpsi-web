import { GET, POST, PUT, DELETE } from './route';
import { NextRequest } from 'next/server';
import { gestorPool, executeWithRetry } from '@/lib/mysql';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
  executeWithRetry: jest.fn(),
}));

describe('API /api/unidades', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return a list of unidades with pagination', async () => {
      const mockUnidades = [
        { id: 1, nome: 'Unidade A' },
        { id: 2, nome: 'Unidade B' },
      ];
      const mockTotal = 2;

      (executeWithRetry as jest.Mock)
        .mockResolvedValueOnce([{ total: mockTotal }]) // for the count
        .mockResolvedValueOnce(mockUnidades); // for the data

      const request = new NextRequest('http://localhost/api/unidades?page=1&limit=10');
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toEqual(mockUnidades);
      expect(body.pagination).toEqual({
        page: 1,
        limit: 10,
        total: mockTotal,
        totalPages: 1,
      });
    });

    it('should return all unidades when all=true', async () => {
        const mockUnidades = [
            { id: 1, nome: 'Unidade A' },
            { id: 2, nome: 'Unidade B' },
          ];
    
          (gestorPool.execute as jest.Mock).mockResolvedValueOnce([mockUnidades]);
    
          const request = new NextRequest('http://localhost/api/unidades?all=true');
          const response = await GET(request);
          const body = await response.json();
    
          expect(response.status).toBe(200);
          expect(body.data).toEqual(mockUnidades);
        });
  });

  describe('POST', () => {
    it('should create a new unidade', async () => {
      const mockUnidade = {
        nome: 'Nova Unidade',
      };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{ insertId: 3 }]);

      const request = new NextRequest('http://localhost/api/unidades', {
        method: 'POST',
        body: JSON.stringify(mockUnidade),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true, id: 3 });
    });
  });

  describe('PUT', () => {
    it('should update a unidade', async () => {
        const mockUnidade = {
            nome: 'Unidade Atualizada',
          };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]);

      const request = new NextRequest('http://localhost/api/unidades?id=1', {
        method: 'PUT',
        body: JSON.stringify(mockUnidade),
      });

      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });

  describe('DELETE', () => {
    it('should soft delete a unidade', async () => {
      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]);

      const request = new NextRequest('http://localhost/api/unidades?id=1', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});