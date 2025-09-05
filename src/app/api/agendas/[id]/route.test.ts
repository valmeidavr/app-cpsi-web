
import { GET, PATCH, PUT } from './route';
import { NextRequest } from 'next/server';
import { gestorPool, executeWithRetry } from '@/lib/mysql';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
  executeWithRetry: jest.fn(),
}));

describe('API /api/agendas/[id]', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return an agenda by id', async () => {
      const mockAgenda = { id: 1, dtagenda: '2023-10-06T10:00:00.000Z', situacao: 'AGENDADO' };

      (executeWithRetry as jest.Mock).mockResolvedValueOnce([mockAgenda]);

      const request = new NextRequest('http://localhost/api/agendas/1');
      const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(mockAgenda);
    });

    it('should return 404 if agenda not found', async () => {
        (executeWithRetry as jest.Mock).mockResolvedValueOnce([]);
  
        const request = new NextRequest('http://localhost/api/agendas/1');
        const response = await GET(request, { params: Promise.resolve({ id: '1' }) });
        const body = await response.json();
  
        expect(response.status).toBe(404);
        expect(body.error).toBe('Agenda não encontrada');
      });
  });

  describe('PATCH', () => {
    it('should update the situacao of an agenda', async () => {
      (executeWithRetry as jest.Mock).mockResolvedValueOnce([{}]);

      const request = new NextRequest('http://localhost/api/agendas/1', {
        method: 'PATCH',
        body: JSON.stringify({ situacao: 'FINALIZADO' }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: '1' }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });

  describe('PUT', () => {
    it('should update an agenda', async () => {
      const mockAgenda = {
        dtagenda: '2023-10-06T10:00:00.000Z',
        situacao: 'FINALIZADO',
      };

      (executeWithRetry as jest.Mock).mockResolvedValueOnce([{}]);

      const request = new NextRequest('http://localhost/api/agendas/1', {
        method: 'PUT',
        body: JSON.stringify(mockAgenda),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '1' }) });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({ success: true });
    });
  });
});
