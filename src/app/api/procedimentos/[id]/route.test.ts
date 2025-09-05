
import { GET, PUT } from './route';
import { NextRequest } from 'next/server';
import { gestorPool } from '@/lib/mysql';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
}));

describe('API /api/procedimentos/[id]', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return a procedimento by id', async () => {
      const mockProcedimento = { id: 1, nome: 'Procedimento A', codigo: 'P01' };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([[mockProcedimento]]);

      const request = new NextRequest('http://localhost/api/procedimentos/1');
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockProcedimento);
    });

    it('should return 404 if procedimento not found', async () => {
        (gestorPool.execute as jest.Mock).mockResolvedValueOnce([[]]);
  
        const request = new NextRequest('http://localhost/api/procedimentos/1');
        const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
        const body = await response.json();
  
        expect(response.status).toBe(404);
        expect(body.error).toBe('Procedimento não encontrado');
      });
  });

  describe('PUT', () => {
    it('should update a procedimento', async () => {
      const mockProcedimento = {
        nome: 'Procedimento Atualizado',
        codigo: 'PA01',
      };

      (gestorPool.execute as jest.Mock).mockResolvedValueOnce([{}]);

      const request = new NextRequest('http://localhost/api/procedimentos/1', {
        method: 'PUT',
        body: JSON.stringify(mockProcedimento),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});
