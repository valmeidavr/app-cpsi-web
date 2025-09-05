
import { GET, POST, PUT, DELETE } from './route';
import { NextRequest } from 'next/server';
import { gestorPool, executeWithRetry } from '@/lib/mysql';

jest.mock('@/lib/mysql', () => ({
  gestorPool: {
    execute: jest.fn(),
  },
  executeWithRetry: jest.fn(),
}));

describe('API /api/expediente', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return a list of expedientes with pagination', async () => {
      const mockExpedientes = [
        { id: 1, dtinicio: '2023-01-01', dtfinal: '2023-01-31' },
        { id: 2, dtinicio: '2023-02-01', dtfinal: '2023-02-28' },
      ];
      const mockTotal = 2;

      (executeWithRetry as jest.Mock)
        .mockResolvedValueOnce(mockExpedientes)
        .mockResolvedValueOnce([{ total: mockTotal }]);

      const request = new NextRequest('http://localhost/api/expediente?page=1&limit=10');
      const response = await GET(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toEqual(mockExpedientes);
      expect(body.pagination).toEqual({
        page: 1,
        limit: 10,
        total: mockTotal,
        totalPages: 1,
      });
    });
  });

  describe('POST', () => {
    it('should create a new expediente and associated agendas', async () => {
        const mockExpediente = {
            dtinicio: '2023-10-01',
            dtfinal: '2023-10-01',
            hinicio: '09:00',
            hfinal: '10:00',
            intervalo: '30',
            semana: 'Domingo',
            alocacao_id: 1,
          };

      (executeWithRetry as jest.Mock)
        .mockResolvedValueOnce({ insertId: 1 }) // expediente creation
        .mockResolvedValueOnce([{ unidade_id: 1, especialidade_id: 1, prestador_id: 1 }]) // alocacao fetch
        .mockResolvedValueOnce([{}]); // agenda creation

      const request = new NextRequest('http://localhost/api/expediente', {
        method: 'POST',
        body: JSON.stringify(mockExpediente),
      });

      const response = await POST(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.expedienteId).toBe(1);
    });
  });

  describe('PUT', () => {
    it('should update an expediente', async () => {
        const mockExpediente = {
            dtinicio: '2023-10-01',
            dtfinal: '2023-10-01',
            hinicio: '09:00',
            hfinal: '10:00',
            intervalo: '30',
            semana: 'Domingo',
            alocacao_id: 1,
          };

      (executeWithRetry as jest.Mock).mockResolvedValueOnce([{}]);

      const request = new NextRequest('http://localhost/api/expediente?id=1', {
        method: 'PUT',
        body: JSON.stringify(mockExpediente),
      });

      const response = await PUT(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });
  });

  describe('DELETE', () => {
    it('should soft delete an expediente', async () => {
      (executeWithRetry as jest.Mock).mockResolvedValueOnce([{}]);

      const request = new NextRequest('http://localhost/api/expediente?id=1', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
    });
  });
});
